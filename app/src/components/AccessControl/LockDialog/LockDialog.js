import React from 'react';
import { connect } from 'react-redux';
import {
	lobbyPeersKeySelector
} from '../../Selectors';
import * as appPropTypes from '../../appPropTypes';
import { withStyles } from '@mui/styles';
import { withRoomContext } from '../../../RoomContext';
import * as roomActions from '../../../actions/roomActions';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
// import FormLabel from '@mui/material/FormLabel';
// import FormControl from '@mui/material/FormControl';
// import FormGroup from '@mui/material/FormGroup';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import Checkbox from '@mui/material/Checkbox';
// import InputLabel from '@mui/material/InputLabel';
// import OutlinedInput from '@mui/material/OutlinedInput';
// import Switch from '@mui/material/Switch';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListLobbyPeer from './ListLobbyPeer';

const styles = (theme) =>
	({
		root :
		{
		},
		dialogPaper :
		{
			width                          : '30vw',
			[theme.breakpoints.down('lg')] :
			{
				width : '40vw'
			},
			[theme.breakpoints.down('md')] :
			{
				width : '50vw'
			},
			[theme.breakpoints.down('sm')] :
			{
				width : '70vw'
			},
			[theme.breakpoints.down('xs')] :
			{
				width : '90vw'
			}
		},
		lock :
		{
			padding : theme.spacing(2)
		}
	});

const LockDialog = ({
	// roomClient,
	room,
	handleCloseLockDialog,
	// handleAccessCode,
	lobbyPeers,
	classes
}) =>
{
	return (
		<Dialog
			className={classes.root}
			open={room.lockDialogOpen}
			onClose={() => handleCloseLockDialog({ lockDialogOpen: false })}
			classes={{
				paper : classes.dialogPaper
			}}
		>
			<DialogTitle id='form-dialog-title'>
				<FormattedMessage
					id='room.lobbyAdministration'
					defaultMessage='Lobby administration'
				/>
			</DialogTitle>
			{/*
			<FormControl component='fieldset' className={classes.formControl}>
				<FormLabel component='legend'>Room lock</FormLabel>
				<FormGroup>
					<FormControlLabel
						control={
							<Switch checked={room.locked} onChange={() => 
							{
								if (room.locked)
								{
									roomClient.unlockRoom();
								}
								else
								{
									roomClient.lockRoom();
								}
							}}
							/>}
						label='Lock'
					/>
						TODO: access code
					<FormControlLabel disabled={ room.locked ? false : true } 
						control={
							<Checkbox checked={room.joinByAccessCode} 
								onChange={
									(event) => roomClient.setJoinByAccessCode(event.target.checked)
								}
							/>}
						label='Join by Access code'
					/>
					<InputLabel htmlFor='access-code-input' />
					<OutlinedInput 
						disabled={ room.locked ? false : true }
						id='acces-code-input'
						label='Access code'
						labelWidth={0}
						variant='outlined'
						value={room.accessCode}
						onChange={(event) => handleAccessCode(event.target.value)}
					>
					</OutlinedInput>
					<Button onClick={() => roomClient.setAccessCode(room.accessCode)} color='primary'>
							save
					</Button>
					
				</FormGroup>
			</FormControl>
			*/}
			{ lobbyPeers.length > 0 ?
				<List 
					dense
					subheader={
						<ListSubheader component='div'>
							<FormattedMessage
								id='room.peersInLobby'
								defaultMessage='Participants in Lobby'
							/>
						</ListSubheader>
					}
				>
					{
						lobbyPeers.map((peerId) =>
						{
							return (<ListLobbyPeer key={peerId} id={peerId} />);
						})
					}
				</List>
				:
				<DialogContent>
					<DialogContentText gutterBottom>
						<FormattedMessage
							id='room.lobbyEmpty'
							defaultMessage='There are currently no one in the lobby'
						/>
					</DialogContentText>
				</DialogContent>
			}
			<DialogActions>
				<Button onClick={() => handleCloseLockDialog({ lockDialogOpen: false })} color='primary'>
					<FormattedMessage
						id='label.close'
						defaultMessage='Close'
					/>
				</Button>
			</DialogActions>
		</Dialog>
	);
};

LockDialog.propTypes =
{
	// roomClient            : PropTypes.any.isRequired,
	room                  : appPropTypes.Room.isRequired,
	handleCloseLockDialog : PropTypes.func.isRequired,
	handleAccessCode      : PropTypes.func.isRequired,
	lobbyPeers            : PropTypes.array,
	classes               : PropTypes.object.isRequired
};

const mapStateToProps = (state) =>
{
	return {
		room       : state.room,
		lobbyPeers : lobbyPeersKeySelector(state)
	};
};

const mapDispatchToProps = {
	handleCloseLockDialog : roomActions.setLockDialogOpen,
	handleAccessCode      : roomActions.setAccessCode
};

export default withRoomContext(connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.room.locked === next.room.locked &&
				prev.room.joinByAccessCode === next.room.joinByAccessCode &&
				prev.room.accessCode === next.room.accessCode &&
				prev.room.code === next.room.code &&
				prev.room.lockDialogOpen === next.room.lockDialogOpen &&
				prev.room.codeHidden === next.room.codeHidden &&
				prev.lobbyPeers === next.lobbyPeers
			);
		}
	}
)(withStyles(styles)(LockDialog)));