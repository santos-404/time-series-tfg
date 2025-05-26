import { useFetch } from '@/hooks/useFetch';
import React from 'react';

// I obviously know this is not a good practice. This is being tested
// on development. This is not gonna be deployed anywhere.
const API_URL = 'http://127.0.0.1:7777/api/v1/'
type ToChange = {};

export const TimeSeries: React.FC = () => {

  const { data, loading, error } = useFetch<ToChange>(API_URL);

  return (
    <div>
    </div>
  );
};

