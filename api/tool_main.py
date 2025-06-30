import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

from db import (
    add_career,
    add_initiative,
    add_memory,
    add_task,
    delete_career,
    delete_initiative,
    delete_task,
    search_career,
    search_information,
    search_initiatives,
    search_memory,
    search_tasks,
    update_career,
    update_initiative,
    update_memory,
    update_task,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()


class DataRequest(BaseModel):
    function_name: str
    args: dict


class DataResponse(BaseModel):
    status: str
    message: str
    data: str | None = None


@app.post("/data", response_model=DataResponse)
async def execute_sql(request: DataRequest) -> DataResponse:
    function_name = request.function_name
    args = request.args
    if "user_id" not in request.args:
        return DataResponse(status="error", message="user_id is required")

    user_id = request.args["user_id"]
    logger.info(f"Received '/data' request: {function_name=}, {args=}")
    try:
        if request.function_name == "search_memory":
            result = search_memory(user_id)
        elif request.function_name == "add_memory":
            result = add_memory(user_id, args["content"], args["category"])
        elif request.function_name == "update_memory":
            result = update_memory(user_id, args["id"], args["content"])
        elif request.function_name == "search_information":
            result = search_information(user_id)
        elif request.function_name == "search_tasks":
            result = search_tasks(user_id)
        elif request.function_name == "add_task":
            result = add_task(
                user_id, args["title"], args["description"], args["recommend"], args["category"], args["estimated_time"]
            )
        elif request.function_name == "update_task":
            result = update_task(
                user_id,
                args["id"],
                args["title"],
                args["description"],
                args["recommend"],
                args["category"],
                args["estimated_time"],
                args["completed"],
            )
        elif request.function_name == "delete_task":
            result = delete_task(user_id, args["id"])
        elif request.function_name == "search_career":
            result = search_career(user_id)
        elif request.function_name == "add_career":
            result = add_career(user_id, args["career_title"], args["career_description"], args["target_period"])
        elif request.function_name == "update_career":
            result = update_career(
                user_id, args["id"], args["career_title"], args["career_description"], args["target_period"]
            )
        elif request.function_name == "delete_career":
            result = delete_career(user_id, args["id"])
        elif request.function_name == "search_initiatives":
            result = search_initiatives(user_id)
        elif request.function_name == "add_initiative":
            result = add_initiative(user_id, args["title"], args["body"], args["target_period"])
        elif request.function_name == "update_initiative":
            result = update_initiative(user_id, args["id"], args["title"], args["body"], args["target_period"])
        elif request.function_name == "delete_initiative":
            result = delete_initiative(user_id, args["id"])
        else:
            return DataResponse(status="error", message=f"Unknown function {request.function_name}")
    except Exception as e:
        logger.error(f"Error in '/data' request: {e}")
        return DataResponse(status="error", message=str(e))

    return DataResponse(status="success", message=f"Successfully executed {request.function_name}", data=result)
