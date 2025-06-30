from pydantic import BaseModel


class FunctionCall(BaseModel):
    name: str
    args: dict


class FunctionResponse(BaseModel):
    arguments: dict
