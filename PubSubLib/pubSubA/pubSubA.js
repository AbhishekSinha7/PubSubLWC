import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';

export default class PubSubDemo extends LightningElement {

	@wire(CurrentPageReference) 
	pageRef;

	handleClick(){
		fireEvent(this.pageRef, 'showMessage', {message: 'Hello World'});
	}
}