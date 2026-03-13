import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiPost } from '../../services/api';
import { saveToken } from '../../utils/auth';
import { normalizeApiError } from '../../utils/errors';
import type { AuthResponse, User } from '../../types';

type FormErrors = Record<string, string>;

type RequiredAuthFields = {
  email: string;
  password: string;
};

interface UseAuthFormConfig<T extends RequiredAuthFields> {
  initialValues: T;
  endpoint: string;
  role: User['role'];
  successRedirect: string;
  submitErrorMessage: string;
  validate: (values: T) => FormErrors;
}

export const useAuthForm = <T extends RequiredAuthFields>({
  initialValues,
  endpoint,
  role,
  successRedirect,
  submitErrorMessage,
  validate,
}: UseAuthFormConfig<T>) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const updateField = (field: keyof T & string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost<AuthResponse>(endpoint, {
        email: values.email,
        password: values.password,
        role,
      });

      if (response) {
        const token = response.token;
        const user = {
          id: response.userId,
          email: response.email,
          role: response.role,
        };

        saveToken(token);
        login(user, token);
        navigate(successRedirect);
      }
    } catch (error) {
      const normalizedError = error instanceof Error
        ? normalizeApiError(error, { defaultMessage: submitErrorMessage })
        : normalizeApiError(error, { defaultMessage: 'An unexpected error occurred. Please try again.' });

      setServerError(normalizedError.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    values,
    errors,
    loading,
    serverError,
    updateField,
    handleSubmit,
  };
};
