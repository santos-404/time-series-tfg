from django.core.validators import MinValueValidator, MaxValueValidator
from rest_framework import serializers
from .models import TimeSeriesData
from django.utils import timezone

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
    prediction_date = serializers.DateField(required=False, help_text="Date for prediction in YYYY-MM-DD format. If not provided, uses 2025-03-30.")

    def validate_prediction_date(self, value):
            if value and value > timezone.now().date():
                raise serializers.ValidationError("La fecha de predicción no puede ser futura.")
            return value

class PredictionResponseSerializer(serializers.Serializer):
    predictions = serializers.ListField(child=serializers.FloatField())
    timestamps = serializers.ListField(child=serializers.DateTimeField())
    model_used = serializers.CharField()
    confidence_interval = serializers.DictField(required=False)
    input_data = serializers.DictField()


class DataDownloadRequestSerializer(serializers.Serializer):
    esios_token = serializers.CharField(
        max_length=500,
        help_text="ESIOS API token for authentication",
    )
    
    download_indicators = serializers.BooleanField(
        default=True,
        help_text="Whether to download the indicators metadata"
    )
    
    years_back = serializers.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
        help_text="Number of years back to download data (1-20 years)"
    )
    
    def validate_esios_token(self, value):
        """
        Validate that the token is not empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("ESIOS token cannot be empty")
        return value.strip()

