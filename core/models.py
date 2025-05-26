from django.db import models

class TimeSeriesData(models.Model):
    datetime_utc = models.DateTimeField()

    hydraulic_71 = models.FloatField(null=True, blank=True)
    hydraulic_36 = models.FloatField(null=True, blank=True)
    hydraulic_1 = models.FloatField(null=True, blank=True)

    solar_14 = models.FloatField(null=True, blank=True)

    wind_12 = models.FloatField(null=True, blank=True)

    nuclear_39 = models.FloatField(null=True, blank=True)
    nuclear_4 = models.FloatField(null=True, blank=True)
    nuclear_74 = models.FloatField(null=True, blank=True)

    peninsula_forecast_460 = models.FloatField(null=True, blank=True)

    scheduled_demand_365 = models.FloatField(null=True, blank=True)
    scheduled_demand_358 = models.FloatField(null=True, blank=True)
    scheduled_demand_372 = models.FloatField(null=True, blank=True)

    daily_spot_market_600_España = models.FloatField(null=True, blank=True)
    daily_spot_market_600_Portugal = models.FloatField(null=True, blank=True)

    average_demand_price_573_Baleares = models.FloatField(null=True, blank=True)
    average_demand_price_573_Canarias = models.FloatField(null=True, blank=True)
    average_demand_price_573_Ceuta = models.FloatField(null=True, blank=True)
    average_demand_price_573_Melilla = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['datetime_utc']
