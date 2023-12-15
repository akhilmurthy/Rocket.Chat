import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type SelectSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	values?: { key: string; i18nLabel: TranslationKey }[];
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	required?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

function SelectSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: SelectSettingInputProps): ReactElement {
	const t = useTranslation();

	const handleChange = (value: string): void => {
		onChangeValue?.(value);
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<Select
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={(value) => handleChange(String(value))}
					options={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)])}
				/>
			</FieldRow>
		</Field>
	);
}

export default SelectSettingInput;
