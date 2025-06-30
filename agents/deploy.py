import os

import vertexai
from dotenv import load_dotenv
from vertexai import agent_engines
from vertexai.preview import reasoning_engines
from vertexai.preview.reasoning_engines import AdkApp

from proxima.agent import root_agent

"""
https://google.github.io/adk-docs/deploy/agent-engine/
"""

load_dotenv()

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION"),
    staging_bucket=os.getenv("GOOGLE_CLOUD_STORAGE_BUCKETS"),
)


def deploy() -> None:
    adk_app = AdkApp(agent=root_agent, enable_tracing=True)
    remote_app = agent_engines.create(
        adk_app,
        display_name=root_agent.name,
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
        extra_packages=["./proxima"],
    )
    print(f"Created remote agent: {remote_app.resource_name}")


def list_session_ids() -> None:
    agent_id = os.getenv("ADK_AGENT_ENGINE_ID")
    remote_app = agent_engines.get(agent_id)

    _ = remote_app.create_session(user_id="user_id", session_id="session_id_a")
    _ = remote_app.create_session(user_id="user_id", session_id="session_id_b")
    _ = remote_app.create_session(user_id="user_id", session_id="session_id_c")

    sessions = remote_app.list_sessions(user_id="user_id")
    for session in sessions["sessions"]:
        print(session["id"])

    remote_app.delete_session(user_id="user_id", session_id="session_id_a")
    remote_app.delete_session(user_id="user_id", session_id="session_id_b")
    remote_app.delete_session(user_id="user_id", session_id="session_id_c")


def check_local() -> None:
    app = reasoning_engines.AdkApp(
        agent=root_agent,
        enable_tracing=False,
    )

    session = app.create_session(user_id="user_id", session_id="session_id")
    for event in app.stream_query(
        user_id="user_id",
        session_id=session.id,
        message="new yorkの天気は？",
    ):
        print(event)


def check_remote() -> None:
    agent_id = os.getenv("ADK_AGENT_ENGINE_ID")
    print(agent_id)

    remote_app = agent_engines.get(agent_id)
    print("1. got")
    remote_session = remote_app.create_session(user_id="user_id")
    print("2. create")
    session_id = remote_session["id"]

    first_message = "こんにちは"
    while True:
        if first_message:
            message = first_message
            first_message = ""
        else:
            message = input("(Exit: break) > ")

        if message == "break":
            break

        for event in remote_app.stream_query(user_id="user_id", session_id=session_id, message=message):
            parts = event["content"]["parts"]
            for part in parts:
                print(part)
                function_call = part.get("function_call")
                function_response = part.get("function_response")
                text = part.get("text")
                if function_call:
                    print(f"function_call: {function_call}")
                elif function_response:
                    print(f"function_response: {function_response}")
                elif text:
                    print(text)
                else:
                    print(part)


def delete_remote_agent(agent_id: str) -> None:
    input(f"Are you ok deleting agent [{agent_id}] ? > (If you ok, please enter.)")
    remote_app = agent_engines.get(agent_id)
    remote_app.delete(force=True)


def delete_remote_sessions(agent_id: str) -> None:
    input(f"Are you ok deleting sessions of agent [{agent_id}] ? > (If you ok, please enter.)")
    remote_app = agent_engines.get(agent_id)
    sessions = remote_app.list_sessions(user_id="user_id")
    for session in sessions["sessions"]:
        remote_app.delete_session(user_id="user_id", session_id=session["id"])


if __name__ == "__main__":
    deploy()
