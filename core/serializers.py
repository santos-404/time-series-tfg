from rest_framework import serializers
from .models import TimeSeriesData

class TimeSeriesDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSeriesData
        fields = '__all__'

class PredictionRequestSerializer(serializers.Serializer):
    model_name = serializers.ChoiceField(
        choices=['linear', 'dense', 'conv', 'lstm'],
        default='lstm'
    )
    hours_ahead = serializers.IntegerField(default=1, min_value=1, max_value=24)
    input_hours = serializers.IntegerField(default=24, min_value=1, max_value=168)

class PredictionResponseSerializer(serializers.Serializer):
    predictions = serializers.ListField(child=serializers.FloatField())
    timestamps = serializers.ListField(child=serializers.DateTimeField())
    model_used = serializers.CharField()
    confidence_interval = serializers.DictField(required=False)
    input_data = serializers.DictField()
