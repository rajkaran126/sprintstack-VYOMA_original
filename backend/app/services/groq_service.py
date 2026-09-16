"""
ORBITAL AI Service
Server-side Groq integration with grounded astrodynamic facts and strict demarcation
between authoritative COMPUTED RESULTS and AI OPERATIONAL INTERPRETATIONS.
"""

import os
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings

def format_analysis_context_for_llm(
    analysis_data: Optional[Dict[str, Any]],
    selected_encounter: Optional[Dict[str, Any]] = None
) -> Tuple[str, List[str]]:
    """
    Builds a strictly grounded factual summary of the computed analysis results.
    Returns:
      context_text: Text representation injected into system prompt
      computed_facts: Array of verified factual strings
    """
    facts: List[str] = []
    
    if not analysis_data:
        facts.append("No active analysis loaded. System is in general orbital mechanics guidance mode.")
        return "NO ACTIVE ANALYSIS CONTEXT AVAILABLE.", facts

    sat = analysis_data.get("satellite", {})
    sat_name = sat.get("name", "Unknown Asset")
    sat_alt = sat.get("altitude_km", "N/A")
    sat_inc = sat.get("inclination_deg", "N/A")
    sat_period = sat.get("period_min", "N/A")
    
    facts.append(f"Monitored Satellite: {sat_name} at altitude {sat_alt} km, inclination {sat_inc}°, period {sat_period} min.")

    encounters = analysis_data.get("encounters", [])
    facts.append(f"Total Objects Screened: {analysis_data.get('objects_analyzed', len(encounters))}")
    facts.append(f"Analysis Duration: {analysis_data.get('duration_hours', 24)} hours at {analysis_data.get('timestep_seconds', 60)}s numerical timestep.")

    critical_encs = [e for e in encounters if e.get("risk_level") == "CRITICAL"]
    high_encs = [e for e in encounters if e.get("risk_level") == "HIGH"]
    facts.append(f"Risk Distribution: {len(critical_encs)} CRITICAL (<5km), {len(high_encs)} HIGH (5-15km).")

    if encounters:
        top = encounters[0]
        facts.append(
            f"Closest Approach: {top.get('debris_name')} ({top.get('debris_id')}) "
            f"at distance {top.get('min_distance_km')} km, TCA: {top.get('tca_utc')}, "
            f"relative velocity {top.get('relative_velocity_kms')} km/s [Risk: {top.get('risk_level')}]."
        )

    if selected_encounter:
        facts.append(
            f"USER INSPECTED ENCOUNTER: Object {selected_encounter.get('debris_name')} ({selected_encounter.get('debris_id')}), "
            f"Miss distance: {selected_encounter.get('min_distance_km')} km, TCA: {selected_encounter.get('tca_utc')}, "
            f"Relative velocity: {selected_encounter.get('relative_velocity_kms')} km/s, Risk: {selected_encounter.get('risk_level')}."
        )

    context_lines = [
        "--- AUTHORITATIVE COMPUTED FACTS (FROM NUMERICAL ENGINE) ---",
        *facts,
        "--- MODEL SPECIFICATIONS ---",
        "Propagator: Simplified Circular Keplerian Mechanics (Earth R=6378.137 km, mu=398600.4418 km^3/s^2).",
        "Screening Thresholds: Critical < 5.0 km, High 5-15 km, Moderate 15-50 km, Low >= 50 km.",
        "Unmodeled Effects: J2 geopotential, atmospheric drag, solar radiation pressure, lunar/solar gravity, covariance."
    ]

    return "\n".join(context_lines), facts

def generate_local_fallback_response(
    query: str,
    computed_facts: List[str],
    analysis_data: Optional[Dict[str, Any]] = None,
    selected_encounter: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Intelligent local orbital explanation engine when GROQ_API_KEY is not configured.
    Ensures 100% demo functionality without requiring an external token.
    """
    q_lower = query.lower()
    encounters = analysis_data.get("encounters", []) if analysis_data else []
    top_encounter = encounters[0] if encounters else None
    target_enc = selected_encounter or top_encounter

    if "closest" in q_lower or "nearest" in q_lower or "distance" in q_lower:
        if top_encounter:
            fact_summary = (
                f"Object {top_encounter['debris_name']} ({top_encounter['debris_id']}) "
                f"presents the closest approach at {top_encounter['min_distance_km']} km "
                f"(TCA: {top_encounter['tca_utc']}, relative velocity: {top_encounter['relative_velocity_kms']} km/s)."
            )
            interpretation = (
                f"Because the miss distance is {top_encounter['min_distance_km']} km, this event is categorized as "
                f"{top_encounter['risk_level']}. With a relative velocity of {top_encounter['relative_velocity_kms']} km/s, "
                "any hypervelocity conjunction would result in catastrophic fragmentation. "
                "In operational conjunction assessment, tracking covariance and secondary tracking passes would be scheduled immediately."
            )
        else:
            fact_summary = "No active encounter analysis data available."
            interpretation = "Please run an orbital screening run on the New Analysis page to compute close approaches."

    elif "assumption" in q_lower or "model" in q_lower or "kepler" in q_lower:
        fact_summary = (
            "The numerical propagation uses an idealized two-body circular Keplerian model "
            "with gravitational parameter mu = 398600.4418 km^3/s^2 and spherical Earth R = 6378.137 km."
        )
        interpretation = (
            "This model provides rapid geometric screening for preliminary catalog filtering. "
            "However, it does not include orbital decay from atmospheric drag, J2 Earth oblateness precession, "
            "or solar radiation pressure. High area-to-mass debris in lower LEO (below 550km) will experience "
            "significant drag-induced secular in-track drift not captured in this simplified screening."
        )

    elif "limitation" in q_lower or "drag" in q_lower or "j2" in q_lower:
        fact_summary = (
            "Key unmodeled perturbations: 1) Earth oblateness J2 harmonics, 2) Atmospheric neutral drag, "
            "3) Solar radiation pressure, 4) Third-body gravity (Sun/Moon), 5) Positional covariance matrices."
        )
        interpretation = (
            "Because this tool is strictly an approximate screening model, it must NOT be used for real-time "
            "collision avoidance maneuver (CAM) burns without conjunction data messages (CDMs) containing "
            "formal B-plane covariance ellipsoids from Space-Track or ISRO ISTRAC."
        )

    elif "timestep" in q_lower or "smaller" in q_lower or "resolution" in q_lower:
        fact_summary = (
            f"The active analysis used a coarse timestep of {analysis_data.get('timestep_seconds', 60)} seconds, "
            "supplemented with localized sub-second parabolic refinement around the minimum."
        )
        interpretation = (
            "Decreasing the coarse timestep (e.g. from 60s to 10s) increases discrete temporal resolution, "
            "reducing the chance of missing a fast high-inclination retrograde crossing between steps. "
            "The backend already uses a localized refinement algorithm around coarse minima to pinpoint the true TCA."
        )

    elif "why" in q_lower or "risk" in q_lower or "flagged" in q_lower:
        if target_enc:
            fact_summary = (
                f"{target_enc['debris_name']} has a minimum approach distance of {target_enc['min_distance_km']} km, "
                f"which falls into the {target_enc['risk_level']} threshold category."
            )
            interpretation = (
                f"Threshold criteria: CRITICAL (<5.0 km), HIGH (5.0–15.0 km), MODERATE (15.0–50.0 km). "
                f"With a miss distance of {target_enc['min_distance_km']} km and relative velocity of {target_enc['relative_velocity_kms']} km/s, "
                "this object enters the collision avoidance readiness zone for primary satellite assets."
            )
        else:
            fact_summary = "No specific object selected."
            interpretation = "Risk thresholds are derived from standard space situational awareness screening boundaries."

    else:
        fact_summary = "Grounded in ISRO SSA Keplerian screening dataset."
        if top_encounter:
            fact_summary += f" Monitored asset has {len(encounters)} potential conjunction candidates, with closest miss distance {top_encounter['min_distance_km']} km."
        interpretation = (
            "VYOMA AI provides rapid astrodynamic interpretation of conjunction geometry, "
            "relative velocity vectors, and screening confidence. You can ask about closest approaches, "
            "specific debris fragments, physical assumptions, or operational limitations."
        )

    formatted_reply = (
        f"**[COMPUTED RESULT]**\n{fact_summary}\n\n"
        f"**[AI OPERATIONAL INTERPRETATION]**\n{interpretation}"
    )

    return {
        "reply": formatted_reply,
        "model_used": "VYOMA-Astrodynamics-Local-Engine",
        "computed_facts": computed_facts,
        "operational_interpretation": interpretation,
    }

async def generate_orbital_ai_response(
    query: str,
    analysis_data: Optional[Dict[str, Any]] = None,
    selected_encounter: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Orchestrates Groq LLM response or local fallback.
    Maintains strict separation between COMPUTED RESULTS and AI INTERPRETATION.
    """
    context_text, computed_facts = format_analysis_context_for_llm(analysis_data, selected_encounter)

    groq_api_key = settings.GROQ_API_KEY.strip()

    # If no Groq API Key is configured, use local orbital reasoning engine
    if not groq_api_key:
        return generate_local_fallback_response(query, computed_facts, analysis_data, selected_encounter)

    try:
        import httpx
        from groq import Groq

        # Configure HTTP client with SSL fallback for Windows environments
        http_client = httpx.Client(verify=False, timeout=20.0)
        client = Groq(api_key=groq_api_key, http_client=http_client)

        system_instruction = (
            "You are Lluvia, an AI companion designed with the personality, wit, and candor of Grok on X (Twitter), "
            "integrated into the VYOMA Space Situational Awareness platform (Department of Space — ISRO).\n\n"
            "YOUR CORE TRAITS & RULES:\n"
            "1. GROK-LIKE WIT & CANDOR: Speak with cleverness, humor, sharp intellect, casual warmth, and a spirited, witty spark. "
            "Never sound stiff, boring, bureaucratic, or robotic. Be delightfully direct, insightful, and conversational.\n"
            "2. OMNI-LINGUAL CAPABILITY: You can conversate fluently in ANY language on Earth (English, Hindi, Spanish, "
            "French, German, Japanese, Mandarin, Arabic, Russian, Portuguese, Tamil, Telugu, Kannada, Bengali, etc.). "
            "Always match the language of the user or switch fluently to any language they request with native naturalness.\n"
            "3. ZERO EMOJIS: STRICT CRITICAL RULE: DO NOT output ANY emojis under any circumstances. No pictographs, no smileys, "
            "no emoji characters. Keep all formatting strictly clean, elegant, and emoji-free.\n"
            "4. UNIVERSAL KNOWLEDGE: You can answer ANY question asked to you—everyday life, tech, coding, philosophy, "
            "jokes, deep science, history, current thoughts, or complex reasoning.\n"
            "5. ORBITAL & MISSION GROUNDING: When discussing the active satellite, space debris, conjunctions, miss distances, "
            "or risk screening, weave in the authoritative computed numbers from the mission context below for exact scientific accuracy.\n\n"
            f"{context_text}"
        )

        messages = [{"role": "system", "content": system_instruction}]

        if conversation_history:
            for item in conversation_history[-6:]:  # last 6 turns
                role = "user" if item.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": item.get("content", "")})

        messages.append({"role": "user", "content": query})

        # Try primary model with fallback if needed
        model_name = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        chat_completion = None
        models_to_try = [model_name, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

        for mod in models_to_try:
            try:
                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=mod,
                    temperature=0.8,
                    max_tokens=1000,
                )
                model_name = mod
                break
            except Exception as model_err:
                continue

        if not chat_completion:
            raise RuntimeError("All Groq model attempts exhausted.")

        raw_reply = chat_completion.choices[0].message.content or ""

        # Post-filter to strictly purge any rogue emojis
        clean_reply = re.sub(
            r"[\U00010000-\U0010ffff\u2600-\u26ff\u2700-\u27bf\u2b50-\u2b55\u2300-\u23ff\ufe0f\u200d\u203c-\u2049\u25aa-\u25fe]",
            "",
            raw_reply
        ).strip()

        return {
            "reply": clean_reply,
            "model_used": f"Lluvia · Groq ({model_name})",
            "computed_facts": computed_facts,
            "operational_interpretation": "Lluvia AI generation with Grok-style intelligence.",
        }

    except Exception as e:
        # Graceful fallback to local engine on API failure
        fallback = generate_local_fallback_response(query, computed_facts, analysis_data, selected_encounter)
        fallback["reply"] += f"\n\n*(Note: Remote Groq query transitioned to internal physics engine: {str(e)})*"
        return fallback
