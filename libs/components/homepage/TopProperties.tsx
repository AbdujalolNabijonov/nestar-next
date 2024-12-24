import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import TopPropertyCard from './TopPropertyCard';
import { PropertiesInquiry } from '../../types/property/property.input';
import { Property } from '../../types/property/property';
import { useMutation, useQuery } from '@apollo/client';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { Member } from '../../types/member/member';
import { sweetErrorHandling, sweetMixinSuccessAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';

interface TopPropertiesProps {
	initialInput: PropertiesInquiry;
}

const TopProperties = (props: TopPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topProperties, setTopProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const {
		data,
		error,
		refetch,
		loading
	} = useQuery(GET_PROPERTIES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTopProperties(data?.getProperties?.list)
		}
	})

	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY)
	/** HANDLERS **/

	const handleLikeTarget = async (user: Member, propertyId: string): Promise<void> => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetProperty({ variables: { input: propertyId } });
			await refetch({input:initialInput})
			await sweetTopSmallSuccessAlert("sucessfully done");
		} catch (err: any) {
			console.log("ERROR: handleLikeTarget ", err.message);
			await sweetErrorHandling(err)
		}
	}

	if (device === 'mobile') {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top properties</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={15}
							modules={[Autoplay]}
						>
							{topProperties.map((property: Property) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={property?._id}>
										<TopPropertyCard property={property} handleLikeTarget={handleLikeTarget}/>
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Top properties</span>
							<p>Check out our Top Properties</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							spaceBetween={15}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-top-next',
								prevEl: '.swiper-top-prev',
							}}
							pagination={{
								el: '.swiper-top-pagination',
							}}
						>
							{topProperties.map((property: Property) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={property?._id}>
										<TopPropertyCard property={property} handleLikeTarget={handleLikeTarget}/>
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TopProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'propertyRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopProperties;