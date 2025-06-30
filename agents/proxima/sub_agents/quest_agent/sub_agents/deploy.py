import os

import vertexai
from dotenv import load_dotenv
from quest_create_agent.agent import quest_create_agent
from vertexai import agent_engines
from vertexai.preview.reasoning_engines import AdkApp

"""
https://google.github.io/adk-docs/deploy/agent-engine/
"""

load_dotenv()

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION"),
    staging_bucket=os.getenv("QUEST_CREATOR_GOOGLE_CLOUD_STORAGE_BUCKETS"),
)


def deploy_quest_creator() -> None:
    adk_app = AdkApp(agent=quest_create_agent, enable_tracing=True)
    remote_app = agent_engines.create(
        adk_app,
        display_name=quest_create_agent.name,
        requirements=[
            "google-adk",
            "google-genai",
            "google-cloud-aiplatform[adk,agent_engines]",
            "cloudpickle",
            "pydantic",
            "requests",
            "beautifulsoup4",
            "google-api-python-client",
            "toolbox",
            "toolbox-core",
            "python-dotenv",
            "cloud-sql-python-connector",
            "pg8000",
            "ulid",
        ],
        extra_packages=["./quest_create_agent"],
    )
    print(f"Created remote agent: {remote_app.resource_name}")


if __name__ == "__main__":
    deploy_quest_creator()
