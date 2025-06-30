import logging

from common.db import (
    fetch_yesterdays_routines_from_db,
    save_routines_to_db,
)
from common.firestore import get_all_user_ids
from common.schemas import Routine

logger = logging.getLogger(__name__)


def _create_new_routines(routines: list[Routine]) -> list[Routine]:
    new_routines = []
    for routine in routines:
        routine.streak += 1
        routine.completed = False
        new_routines.append(routine)
    return new_routines


def routine(user_id: str | None = None) -> tuple[str, int]:
    """
    ユーザーの情報をもとに、クエストを作成する
    """
    if not user_id:
        user_ids = get_all_user_ids()
        for user_id in user_ids:
            routine(user_id)
        return ("OK", 200)
    routines = fetch_yesterdays_routines_from_db(user_id)
    new_routines = _create_new_routines(routines)
    save_routines_to_db(new_routines)
    return ("OK", 200)
