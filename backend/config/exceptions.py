from rest_framework.views import exception_handler as drf_exception_handler


def _message(detail):
    if isinstance(detail, list):
        return "; ".join(str(item) for item in detail)
    return str(detail)


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, dict) and set(data.keys()) == {"detail"}:
        message = _message(data["detail"])
        response.data = {"error": message, "detail": message}
        return response

    if isinstance(data, dict):
        messages = []
        for value in data.values():
            if isinstance(value, list):
                messages.extend(str(item) for item in value)
            else:
                messages.append(str(value))
        if len(messages) == 1:
            response.data = {"error": messages[0], "detail": messages[0], "fields": data}
            return response
        response.data = {
            "error": "Invalid request.",
            "detail": "Invalid request.",
            "fields": data,
        }
        return response

    message = _message(data)
    response.data = {"error": message, "detail": message}
    return response
