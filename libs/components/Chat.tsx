import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Box, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Badge from '@mui/material/Badge';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { useReactiveVar } from '@apollo/client';
import { socketVar, userVar } from '../../apollo/store';
import { Member } from '../types/member/member';
import { RippleBadge } from '../../scss/MaterialTheme/styled';
import { REACT_APP_API_URL } from '../config';
import { sweetErrorAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../sweetAlert';
import { Message } from '../enums/common.enum';

const NewMessage = (type: any) => {
	if (type === 'right') {
		return (
			<Box
				component={'div'}
				flexDirection={'row'}
				style={{ display: 'flex' }}
				alignItems={'flex-end'}
				justifyContent={'flex-end'}
				sx={{ m: '10px 0px' }}
			>
				<div className={'msg_right'}></div>
			</Box>
		);
	} else {
		return (
			<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
				<Avatar alt={'jonik'} src={'/img/profile/defaultUser.svg'} />
				<div className={'msg_left'}></div>
			</Box>
		);
	}
};

interface InfoPayload {
	event: string;
	totalClient: number;
	memberData: Member | null;
	action: string
}

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member | null;
	action: string
}

const Chat = () => {
	const chatContentRef = useRef<HTMLDivElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number>(0);
	const textInput = useRef(null);
	const [message, setMessage] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [openButton, setOpenButton] = useState(false);
	const router = useRouter();
	const user = useReactiveVar(userVar)
	const webSocket = useReactiveVar(socketVar)

	/** LIFECYCLES **/
	useEffect(() => {
		webSocket.onopen = (data) => {
			console.log("===Connection WebSocket===")
		}

		webSocket.onmessage = (data) => {
			let socketMsg = JSON.parse(data.data)
			switch (socketMsg.event) {
				case "info":
					setOnlineUsers(socketMsg.totalClient)
					break
				case "getMessages":
					setMessagesList(socketMsg.list)
					break
				case "message":
					messagesList.push(socketMsg as MessagePayload)
					setMessagesList([...messagesList])
					break
				default:
					break
			}
		}

	}, [webSocket])

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setOpenButton(true);
		}, 100);
		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(() => {
		setOpenButton(false);
	}, [router.pathname]);

	/** HANDLERS **/
	const handleOpenChat = () => {
		setOpen((prevState) => !prevState);
	};

	const getInputMessageHandler = useCallback(
		(e: any) => {
			const text = e.target.value;
			setMessage(text);
		},
		[message],
	);

	const getKeyHandler = (e: any) => {
		try {
			if (e.key == 'Enter') {
				onClickHandler();
			}
		} catch (err: any) {
			console.log(err);
		}
	};

	const onClickHandler = async () => {
		try {
			if (!message) await sweetErrorAlert(Message.PROVIDE_MESSAGE)
			const msg = {
				event: "message",
				data: message
			}
			webSocket.send(JSON.stringify(msg));
			await sweetTopSmallSuccessAlert("Success", 600)
			setMessage("")
		} catch (err: any) {
			console.log("ERROR: onClickHandler", err)
			await sweetErrorHandling(err)
		}
	};

	return (
		<Stack className="chatting">
			{openButton ? (
				<button className="chat-button" onClick={handleOpenChat}>
					{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
				</button>
			) : null}
			<Stack className={`chat-frame ${open ? 'open' : ''}`}>
				<Stack className={'chat-top'} component={'div'} direction={"row"} gap={"20px"}>
					<div style={{ fontFamily: 'Nunito' }}>Online Chat</div>
					<RippleBadge badgeContent={onlineUsers} />
				</Stack>
				<Box className={'chat-content'} id="chat-content" ref={chatContentRef} component={'div'}>
					<ScrollableFeed>
						<Stack className={'chat-main'}>
							<Stack style={{ alignSelf: "center" }} component={'div'}>
								<div className={'msg-left'}>Welcome to Live chat!</div>
							</Stack>
							{messagesList.map((msg: MessagePayload) => {
								if (msg.memberData?._id === user._id) {
									return (
										<Box
											component={'div'}
											flexDirection={'row'}
											style={{ display: 'flex' }}
											alignItems={'flex-end'}
											justifyContent={'flex-end'}
											sx={{ m: '10px 0px' }}
										>
											<div className={'msg-right'}>{msg.text}</div>
										</Box>
									)
								} else {
									return (
										<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
											<Avatar alt={'jonik'} src={msg.memberData?.memberImage ? `${REACT_APP_API_URL}/${msg.memberData?.memberImage}` : '/img/profile/defaultUser.svg'} />
											<div className={'msg-left'}>{msg.text}</div>
										</Box>
									)
								}
							})}
						</Stack>
					</ScrollableFeed>
				</Box>
				<Box className={'chat-bott'} component={'div'}>
					<input
						ref={textInput}
						type={'text'}
						value={message}
						name={'message'}
						className={'msg-input'}
						placeholder={'Type message'}
						onChange={getInputMessageHandler}
						onKeyDown={getKeyHandler}
					/>
					<button className={'send-msg-btn'} onClick={onClickHandler}>
						<SendIcon style={{ color: '#fff' }} />
					</button>
				</Box>
			</Stack>
		</Stack>
	);
};

export default Chat;
