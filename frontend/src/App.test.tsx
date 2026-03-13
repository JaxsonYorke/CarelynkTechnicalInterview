import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./Router', () => () => <div>Carelynk Router</div>);

test('renders app router', () => {
  render(<App />);
  expect(screen.getByText('Carelynk Router')).toBeInTheDocument();
});
