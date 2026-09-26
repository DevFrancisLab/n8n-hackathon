from decimal import Decimal


def money(value):
    amount = Decimal(value).quantize(Decimal("0.01"))
    if amount == amount.to_integral():
        return int(amount)
    return float(amount)
