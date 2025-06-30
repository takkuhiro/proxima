from google.adk.agents import LlmAgent, LoopAgent, SequentialAgent
from google.adk.tools.tool_context import ToolContext

from .prompt import CRITIC_AGENT_INSTRUCTION, INITIAL_CREATOR_AGENT_INSTRUCTION, REFINER_AGENT_INSTRUCTION


def exit_loop(tool_context: ToolContext, completed_quest: str) -> dict[str, str]:
    """この関数は、デイリークエストの作成が完了したことを示すためだけに使用します。
    Args:
        tool_context (ToolContext): ツールコンテキスト
        completed_quest (str): デイリークエストの作成が完了したことを示すために使用します。

    Returns:
        dict: デイリークエストの作成が完了したことを示すために使用します。
    """
    tool_context.actions.escalate = True
    return {"completed_quest": completed_quest}


initial_creator_agent = LlmAgent(
    name="InitialCreatorAgent",
    model="gemini-2.5-flash",
    include_contents="default",
    instruction=INITIAL_CREATOR_AGENT_INSTRUCTION,
    description="デイリークエストを生成します。",
    output_key="current_quest",
)

critic_agent_in_loop = LlmAgent(
    name="CriticAgent",
    model="gemini-2.5-pro",
    include_contents="none",
    instruction=CRITIC_AGENT_INSTRUCTION,
    description="デイリークエストをレビューします。",
    output_key="criticism",
)


refiner_agent_in_loop = LlmAgent(
    name="RefinerAgent",
    model="gemini-2.5-pro",
    include_contents="none",
    instruction=REFINER_AGENT_INSTRUCTION,
    description="デイリークエストを校正・校閲します。",
    tools=[exit_loop],
    output_key="current_quest",
)


refinement_loop = LoopAgent(
    name="RefinementLoop",
    sub_agents=[
        critic_agent_in_loop,
        refiner_agent_in_loop,
    ],
    max_iterations=3,
)

quest_create_agent = SequentialAgent(
    name="QuestCreateAgent",
    sub_agents=[
        initial_creator_agent,
        refinement_loop,
    ],
    description="デイリークエストを作成します。",
)
