export interface IContactsProps {
	contactData: IContactData;
}

export interface IHeaderProps {
	darkMode: boolean;
}

export interface IModalProps {
	show: boolean;
	title: string;
}

export interface IOrderProps {
	order: IOrderItem[];
	total: number;
}

export interface IPizzaCardProps {
	image: string;
	name: string;
	price: number;
	order: IOrderItem[];
}

export interface IPizza {
	id: string;
	image: string;
	name: string;
	price: number;
	action?: string;
}

export interface IOrderItem {
	id: string;
	name: string;
	count: number;
	price: number;
}

export interface IContactData {
	first_name: string;
	last_name: string;
	phone_number: string;
	user_id: string;
	unsafe: string;
	address?: string;
}

export interface IWebData {
	initData: string;
	initDataUnsafe: string;
	version: string;
	platform: string;
	close: () => void;
}
