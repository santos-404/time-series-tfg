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

class PredictionHistory(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    model_used = models.CharField(max_length=50)  
    hours_ahead = models.IntegerField()
    input_hours = models.IntegerField()
    
    prediction_date = models.DateField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    predictions = models.JSONField()  
    timestamps = models.JSONField()   
    
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['model_used']),
            models.Index(fields=['prediction_date']),
        ]
    
    def __str__(self):
        return f"Prediction {self.id} - {self.model_used} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def prediction_summary(self):
        """Return a summary of the prediction for the new dict format"""
        if not self.predictions:
            return None
            
        try:
            summary = {
                'format': 'multi_label',
                'labels': {},
                'total_predictions': 0
            }
            
            for label, values in self.predictions.items():
                if isinstance(values, list):
                    numeric_values = []
                    for val in values:
                        try:
                            numeric_values.append(float(val))
                        except (ValueError, TypeError):
                            continue
                    
                    if numeric_values:
                        summary['labels'][label] = {
                            'count': len(numeric_values),
                            'min': min(numeric_values),
                            'max': max(numeric_values),
                            'avg': sum(numeric_values) / len(numeric_values)
                        }
                        summary['total_predictions'] += len(numeric_values)
                    else:
                        summary['labels'][label] = {
                            'count': 0,
                            'min': None,
                            'max': None,
                            'avg': None
                        }
            
            return summary
                
        except Exception as e:
            return None
