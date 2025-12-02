import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import * as notificationActions from '../../actions/notificationActions';

const Notifications = ({ notifications = [], removeNotification }) =>
{
	const { enqueueSnackbar } = useSnackbar();
	const displayedRef = useRef([]);

	useEffect(() =>
	{
		notifications.forEach((notification) =>
		{
			// Do nothing if snackbar is already displayed
			if (displayedRef.current.includes(notification.id)) return;
			// Display snackbar using notistack
			enqueueSnackbar(notification.text,
				{
					variant          : notification.type,
					autoHideDuration : notification.timeout,
					anchorOrigin     : {
						vertical   : 'bottom',
						horizontal : 'left'
					}
				}
			);
			// Keep track of snackbars that we've displayed
			displayedRef.current = [ ...displayedRef.current, notification.id ];
			// Dispatch action to remove snackbar from redux store
			removeNotification(notification.id);
		});
	}, [notifications, enqueueSnackbar, removeNotification]);

	return null;
};

Notifications.propTypes =
{
	notifications      : PropTypes.array.isRequired,
	removeNotification : PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
	({
		notifications : state.notifications
	});

const mapDispatchToProps = (dispatch) =>
	({
		removeNotification : (notificationId) =>
			dispatch(notificationActions.removeNotification({ notificationId }))
	});

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.notifications === next.notifications
			);
		}
	}
)(Notifications);
