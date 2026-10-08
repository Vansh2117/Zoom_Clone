from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    personal_meeting_id: str


class HostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
