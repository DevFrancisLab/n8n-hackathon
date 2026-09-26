from config.money import money
from config.time import isoformat
from events.serializers import EventSerializer


def checkout_payload(checkout):
    return {
        "id": str(checkout.id),
        "movieId": checkout.movie_id,
        "customerId": str(checkout.customer_id),
        "name": checkout.name,
        "email": checkout.email,
        "phone": checkout.phone,
        "paymentMethod": checkout.payment_method,
        "status": checkout.status,
        "amount": money(checkout.amount),
        "createdAt": isoformat(checkout.created_at),
        "updatedAt": isoformat(checkout.updated_at),
    }


def purchase_payload(purchase):
    return {
        "id": str(purchase.id),
        "movieId": purchase.movie_id,
        "customerId": str(purchase.customer_id),
        "checkoutId": str(purchase.checkout_id),
        "amount": money(purchase.amount),
        "paymentMethod": purchase.payment_method,
        "purchasedAt": isoformat(purchase.created_at),
    }


def with_events(body, events):
    if events:
        body["events"] = EventSerializer(events, many=True).data
    return body
