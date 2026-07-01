import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import InlineCombobox from './InlineCombobox';

describe('InlineCombobox', () => {
	const renderCombobox = (value: string, suggestedValues: string[]) => {
		const onChange = jest.fn();

		render(
			<InlineCombobox
				inputStyle={{}}
				value={value}
				onChange={onChange}
				suggestedValues={suggestedValues}
				renderOption={suggestedValue => <>{suggestedValue}</>}
				inputId='test-combobox'
			/>,
		);

		return {
			input: screen.getByRole('combobox'),
			onChange,
		};
	};

	test('should not select an undefined suggestion with Enter', () => {
		const { input, onChange } = renderCombobox('zz', ['alpha', 'beta']);

		fireEvent.keyDown(input, { code: 'Enter' });

		expect(onChange).not.toHaveBeenCalled();
	});

	test('should not select an undefined suggestion with arrow keys when no suggestions exist', () => {
		const { input, onChange } = renderCombobox('', []);

		fireEvent.keyDown(input, { code: 'ArrowDown' });

		expect(onChange).not.toHaveBeenCalled();
	});
});
