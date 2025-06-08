from django.core.validators import MinValueValidator, MaxValueValidator
from rest_framework import serializers
from .models import TimeSeriesData, PredictionHistory
from datetime import date

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
        if value and value > date.today():
            raise serializers.ValidationError("La fecha final no puede ser futura.")
        if value and value < date(2020, 1, 1):
            raise serializers.ValidationError("La fecha final no puede ser anterior a 2020-01-01.")
        return value


class PredictionResponseSerializer(serializers.Serializer):
    predictions = serializers.ListField(child=serializers.FloatField())
    timestamps = serializers.ListField(child=serializers.DateTimeField())
    model_used = serializers.CharField()
    confidence_interval = serializers.DictField(required=False)
    input_data = serializers.DictField()


class HistoricalDataRequestSerializer(serializers.Serializer):
    days = serializers.IntegerField(default=7, min_value=1, help_text="Number of days to retrieve data for")
    end_date = serializers.DateField(required=False, help_text="End date for data retrieval in YYYY-MM-DD format. If not provided, uses 2025-03-30.")
    columns = serializers.CharField(required=False, help_text="Comma-separated list of columns to retrieve")
    
    def validate_end_date(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("La fecha final no puede ser futura.")
        if value and value < date(2020, 1, 1):
            raise serializers.ValidationError("La fecha final no puede ser anterior a 2020-01-01.")
        return value
    
    def validate_columns(self, value):
        if value:
            columns = [col.strip() for col in value.split(',') if col.strip()]
            return columns
        return []


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
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Number of years back to download data (1-5 years)"
    )
    
    def validate_esios_token(self, value):
        """
        Validate that the token is not empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("ESIOS token cannot be empty")
        return value.strip()


class PredictionHistorySerializer(serializers.ModelSerializer):
    """Serializer for PredictionHistory model"""
    
    prediction_summary = serializers.ReadOnlyField()
    
    class Meta:
        model = PredictionHistory
        fields = [
            'id',
            'created_at',
            'model_used',
            'hours_ahead',
            'input_hours',
            'prediction_date',
            'start_time',
            'end_time',
            'predictions',
            'timestamps',
            'notes',
            'prediction_summary'
        ]
        read_only_fields = ['id', 'created_at', 'prediction_summary']


class PredictionHistoryListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing predictions (without full prediction data)"""
    
    prediction_summary = serializers.ReadOnlyField()
    predictions_count = serializers.SerializerMethodField()
    labels_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PredictionHistory
        fields = [
            'id',
            'created_at',
            'model_used',
            'hours_ahead',
            'input_hours',
            'prediction_date',
            'start_time',
            'end_time',
            'predictions_count',
            'labels_info',
            'prediction_summary',
            'notes'
        ]
    
    def get_predictions_count(self, obj):
        """Return the total number of predictions across all labels"""
        if not obj.predictions:
            return 0
            
        # Handle both old format (list) and new format (dict)
        if isinstance(obj.predictions, list):
            return len(obj.predictions)
        elif isinstance(obj.predictions, dict):
            total = 0
            for label, values in obj.predictions.items():
                if isinstance(values, list):
                    total += len(values)
            return total
        else:
            return 0
    
    def get_labels_info(self, obj):
        """Return information about labels in the prediction"""
        if not obj.predictions:
            return None
            
        if isinstance(obj.predictions, list):
            return {'format': 'legacy_list', 'labels': None}
        elif isinstance(obj.predictions, dict):
            labels_count = {}
            for label, values in obj.predictions.items():
                if isinstance(values, list):
                    labels_count[label] = len(values)
                else:
                    labels_count[label] = 0
            return {'format': 'multi_label', 'labels': labels_count}
        else:
            return None


class PredictionHistoryFilterSerializer(serializers.Serializer):
    """Serializer for filtering prediction history"""
    
    model_used = serializers.ChoiceField(
        choices=['linear', 'dense', 'conv', 'lstm'],
        required=False,
        help_text="Filter by model type"
    )
    date_from = serializers.DateField(
        required=False,
        help_text="Filter predictions created from this date (YYYY-MM-DD)"
    )
    date_to = serializers.DateField(
        required=False,
        help_text="Filter predictions created up to this date (YYYY-MM-DD)"
    )
    prediction_date = serializers.DateField(
        required=False,
        help_text="Filter by prediction date (YYYY-MM-DD)"
    )
    hours_ahead = serializers.IntegerField(
        required=False,
        min_value=1,
        help_text="Filter by hours ahead predicted"
    )
    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=1000,
        default=100,
        help_text="Maximum number of results to return"
    )
