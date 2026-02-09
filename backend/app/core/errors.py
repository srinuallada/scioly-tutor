"""Application exception types and HTTP mapping."""


class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class UnsupportedFileError(AppError):
    def __init__(self, filename: str):
        super().__init__(f"Unsupported file type: {filename}", status_code=400)


class LLMError(AppError):
    def __init__(self, message: str):
        super().__init__(message, status_code=502)


class NoMaterialsError(AppError):
    def __init__(self):
        super().__init__("No study materials loaded", status_code=404)
