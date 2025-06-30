import os

from toolbox_core import ToolboxSyncClient
from toolbox_core.sync_client import ToolboxSyncTool


def _setup_toolbox() -> ToolboxSyncClient:
    """
    MCP Toolboxの設定
    """
    os.environ["MCP_TOOLBOX_URL"] = "YOUR_ENV"
    MCP_TOOLBOX_URL = os.getenv("MCP_TOOLBOX_URL")
    if not MCP_TOOLBOX_URL:
        raise ValueError("MCP_TOOLBOX_URL is not set")
    toolbox = ToolboxSyncClient(MCP_TOOLBOX_URL)
    return toolbox


def load_memory_toolset() -> list[ToolboxSyncTool]:
    toolbox = _setup_toolbox()
    return toolbox.load_toolset("memory_toolset")


def load_task_toolset() -> list[ToolboxSyncTool]:
    toolbox = _setup_toolbox()
    return toolbox.load_toolset("task_toolset")
