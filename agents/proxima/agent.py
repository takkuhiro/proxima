"""
Proxima core agent
"""

from google.adk.agents import LlmAgent

from . import prompt
from .sub_agents.career_agent import career_agent
from .sub_agents.quest_agent import quest_agent
from .tools import google_search, search_information, search_memory

proxima_agent = LlmAgent(
    name="proxima_agent",
    model="gemini-2.5-flash",
    description="Proximaのメインエージェントです。エンジニアであるマスターとの雑談や応援を行います。",
    instruction=prompt.ROOT_AGENT_INSTRUCTION,
    global_instruction="文単位で改行してください。",
    sub_agents=[career_agent, quest_agent],
    tools=[google_search, search_memory, search_information],  # type: ignore
)

root_agent = proxima_agent
