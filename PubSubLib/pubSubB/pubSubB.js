import { LightningElement, wire} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class PubSubB extends LightningElement {
	message ='No Hello';
	
	@wire(CurrentPageReference) 
	pageRef;

	connectedCallback() {
		registerListener('showMessage', this.handleEvent, this);
	}

	disconnectedCallback() {
		unregisterAllListeners(this);
	}

	handleEvent(event){
        this.message = event.message;
    }

}