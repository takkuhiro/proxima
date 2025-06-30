"""
Proxima quest agent.
"""

from google.adk.agents import Agent

from ...tools import add_task, delete_task, google_search, search_initiatives, search_memory, search_tasks, update_task
from . import prompt
from .sub_agents.quest_create_agent import quest_create_agent

quest_agent = Agent(
    name="quest_agent",
    model="gemini-2.5-flash",
    description="マスターのデイリークエストに関するエージェントです。名前は楓 (かえで)です。",
    instruction=prompt.QUEST_AGENT_INSTRUCTION,
    sub_agents=[quest_create_agent],
    tools=[google_search, search_memory, search_tasks, add_task, update_task, delete_task, search_initiatives],
)
