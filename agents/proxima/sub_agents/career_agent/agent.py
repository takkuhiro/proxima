"""
Proxima career agent
"""

from google.adk.agents import Agent

from ...tools import (
    add_career,
    add_initiative,
    delete_career,
    delete_initiative,
    google_search,
    search_career,
    search_initiatives,
    search_memory,
    update_career,
    update_initiative,
)
from . import prompt

tools = [
    google_search,
    search_memory,
    search_career,
    add_career,
    update_career,
    delete_career,
    search_initiatives,
    add_initiative,
    update_initiative,
    delete_initiative,
]

career_agent = Agent(
    name="career_agent",
    model="gemini-2.5-pro",
    description="マスターのキャリアエージェントです。名前は麗華 (れいか)です。",
    instruction=prompt.CAREER_AGENT_INSTRUCTION,
    tools=tools,  # type: ignore
)
