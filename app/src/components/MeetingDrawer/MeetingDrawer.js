import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import * as toolareaActions from '../../actions/toolareaActions';
import { useIntl } from 'react-intl';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Chat from './Chat/Chat';
import FileSharing from './FileSharing/FileSharing';
import ParticipantList from './ParticipantList/ParticipantList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';

const tabs =
[
	'chat',
	'files',
	'users'
];

const styles = (theme) =>
	({
		root :
		{
			display         : 'flex',
			flexDirection   : 'column',
			width           : '100%',
			height          : '100%',
			backgroundColor : theme.palette.background.paper
		},
		appBar :
		{
			display       : 'flex',
			flexDirection : 'row'
		},
		tabsHeader :
		{
			flexGrow : 1
		}
	});

const MeetingDrawer = (props) =>
{
	const intl = useIntl();

	const {
		currentToolTab,
		unreadMessages,
		unreadFiles,
		closeDrawer,
		setToolTab,
		classes,
		theme
	} = props;

	return (
		<div className={classes.root}>
			<AppBar
				position='static'
				color='default'
				className={classes.appBar}
			>
				<Tabs
					className={classes.tabsHeader}
					value={tabs.indexOf(currentToolTab)}
					onChange={(event, value) => setToolTab(tabs[value])}
					indicatorColor='primary'
					textColor='primary'
					variant='fullWidth'
				>
					<Tab
						label={
							<Badge color='secondary' badgeContent={unreadMessages}>
								{intl.formatMessage({
									id             : 'label.chat',
									defaultMessage : 'Chat'
								})}
							</Badge>
						}
					/>
					<Tab
						label={
							<Badge color='secondary' badgeContent={unreadFiles}>
								{intl.formatMessage({
									id             : 'label.filesharing',
									defaultMessage : 'File sharing'
								})}
							</Badge>
						}
					/>
					<Tab
						label={intl.formatMessage({
							id             : 'label.participants',
							defaultMessage : 'Participants'
						})}
					/>
				</Tabs>
				<IconButton onClick={closeDrawer}>
					{theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
				</IconButton>
			</AppBar>
			{currentToolTab === 'chat' && <Chat />}
			{currentToolTab === 'files' && <FileSharing />}
			{currentToolTab === 'users' && <ParticipantList />}
		</div>
	);
};

MeetingDrawer.propTypes =
{
	currentToolTab : PropTypes.string.isRequired,
	setToolTab     : PropTypes.func.isRequired,
	unreadMessages : PropTypes.number.isRequired,
	unreadFiles    : PropTypes.number.isRequired,
	closeDrawer    : PropTypes.func.isRequired,
	classes        : PropTypes.object.isRequired,
	theme          : PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
	currentToolTab : state.toolarea.currentToolTab,
	unreadMessages : state.toolarea.unreadMessages,
	unreadFiles    : state.toolarea.unreadFiles
});

const mapDispatchToProps = {
	setToolTab : toolareaActions.setToolTab
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.toolarea.currentToolTab === next.toolarea.currentToolTab &&
				prev.toolarea.unreadMessages === next.toolarea.unreadMessages &&
				prev.toolarea.unreadFiles === next.toolarea.unreadFiles
			);
		}
	}
)(withStyles(styles, { withTheme: true })(MeetingDrawer));
