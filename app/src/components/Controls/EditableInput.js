import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function EditableInput({
	value,
	propName,
	className = '',
	classLoading = '',
	classInvalid = '',
	editProps = {},
	onChange
})
{
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);
	const [isLoading, setIsLoading] = useState(false);
	const [isInvalid, setIsInvalid] = useState(false);
	const inputRef = useRef(null);

	useEffect(() =>
	{
		setEditValue(value);
	}, [value]);

	useEffect(() =>
	{
		if (isEditing && inputRef.current)
		{
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleClick = () =>
	{
		if (!isEditing)
		{
			setIsEditing(true);
		}
	};

	const handleBlur = () =>
	{
		if (isEditing)
		{
			setIsEditing(false);
			if (editValue !== value)
			{
				setIsLoading(true);
				try
				{
					const data = { [propName]: editValue };
					onChange(data);
					setIsLoading(false);
					setIsInvalid(false);
				}
				catch (error)
				{
					setIsLoading(false);
					setIsInvalid(true);
					setEditValue(value);
				}
			}
		}
	};

	const handleKeyDown = (e) =>
	{
		if (e.key === 'Enter')
		{
			inputRef.current?.blur();
		}
		else if (e.key === 'Escape')
		{
			setEditValue(value);
			setIsEditing(false);
			setIsInvalid(false);
		}
	};

	const handleChange = (e) =>
	{
		setEditValue(e.target.value);
	};

	const displayClasses = `${className} ${isLoading ? classLoading : ''} ${isInvalid ? classInvalid : ''}`.trim();

	if (isEditing)
	{
		return (
			<input
				ref={inputRef}
				type="text"
				value={editValue}
				onChange={handleChange}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				className={displayClasses}
				{...editProps}
			/>
		);
	}

	return (
		<span
			onClick={handleClick}
			className={displayClasses}
			style={{ cursor: 'pointer' }}
		>
			{value}
		</span>
	);
}

EditableInput.propTypes =
{
	value        : PropTypes.string,
	propName     : PropTypes.string.isRequired,
	className    : PropTypes.string,
	classLoading : PropTypes.string,
	classInvalid : PropTypes.string,
	editProps    : PropTypes.any,
	onChange     : PropTypes.func.isRequired
};
