
from typing import TypedDict, List, Dict
from langgraph.graph import StateGraph, END



# 🧠 STATE
class ScanState(TypedDict):
    risks: Dict[str, float]
    anti_patterns: List[str]
    features: List[dict]
    recommendations: List[dict]


# 🎯 HELPER: severity
def severity_from_risk(score: float) -> str:
    if score >= 0.8: return "critical"
    if score >= 0.6: return "high"
    if score >= 0.35: return "medium"
    return "low"


# 🔍 HELPER: get feature for module
def get_feature(module: str, features: List[dict]) -> dict:
    for f in features:
        if f["module"] == module:
            return f
    return {}


# 🧠 NODE 1: interpret ML output
def risk_interpreter_node(state: ScanState):
    risks = state["risks"]
    features = state["features"]
    anti_patterns = state["anti_patterns"]

    results = []

    sorted_risks = sorted(risks.items(), key=lambda x: x[1], reverse=True)[:10]

    for module, score in sorted_risks:
        feature = get_feature(module, features)
        severity = severity_from_risk(score)

        reasons = []

        # 🎯 FEATURE-BASED reasoning
        if feature.get("coupling_between_objects", 0) > 5:
            reasons.append("high coupling with other modules")

        if feature.get("code_churn", 0) > 20:
            reasons.append("frequently modified code (high churn)")

        if feature.get("cyclomatic_complexity", 0) > 5:
            reasons.append("complex control flow")

        if feature.get("duplication_percentage", 0) > 10:
            reasons.append("code duplication detected")

        # 🔁 anti-pattern correlation
        if any("Circular" in p for p in anti_patterns):
            reasons.append("involved in circular dependency")

        explanation = (
            f"{module} is {severity} risk ({score}). "
            + ("Main issues: " + ", ".join(reasons) if reasons else "General structural risk detected.")
        )

        results.append({
            "module": module,
            "severity": severity,
            "score": score,
            "reasons": reasons,
            "explanation": explanation
        })

    return {"recommendations": results}


# 🛠️ NODE 2: generate fixes
def fix_generator_node(state: ScanState):
    recommendations = state["recommendations"]

    for rec in recommendations:
        actions = []

        if "high coupling with other modules" in rec["reasons"]:
            actions.append("Reduce dependencies and introduce interfaces")

        if "frequently modified code (high churn)" in rec["reasons"]:
            actions.append("Stabilize module with better testing")

        if "complex control flow" in rec["reasons"]:
            actions.append("Simplify logic and split functions")

        if "code duplication detected" in rec["reasons"]:
            actions.append("Refactor duplicated code into reusable components")

        if "involved in circular dependency" in rec["reasons"]:
            actions.append("Break circular dependencies")

        if not actions:
            actions.append("General refactoring recommended")

        rec["actions"] = actions

    return {"recommendations": recommendations}


# 🧱 BUILD GRAPH
def create_reasoning_graph():
    workflow = StateGraph(ScanState)

    workflow.add_node("interpret", risk_interpreter_node)
    workflow.add_node("fix", fix_generator_node)

    workflow.set_entry_point("interpret")
    workflow.add_edge("interpret", "fix")
    workflow.add_edge("fix", END)

    return workflow.compile()


# 🚀 GLOBAL INSTANCE
reasoning_app = create_reasoning_graph()


# 🔌 ENTRY FUNCTION
def run_langgraph_reasoning(
    risks: dict[str, float],
    anti_patterns: list[str],
    features: list[dict]
) -> list[dict]:

    state = {
        "risks": risks,
        "anti_patterns": anti_patterns,
        "features": features,
        "recommendations": []
    }

    result = reasoning_app.invoke(state)
    return result["recommendations"]