import { LightningElement, wire } from 'lwc';
import recordSelected from "@salesforce/messageChannel/messageChannelName__c";

import getRelatedRec from '@salesforce/apex/Controller.getRelatedRecords';
import getAllAccountAndRelatedData from '@salesforce/apex/Controller.getAllAccountAndRelatedData';
import deleteRecord from '@salesforce/apex/Controller.deleteRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
import { subscribe, unsubscribe, APPLICATION_SCOPE, MessageContext } from "lightning/messageService";

export default class ComponentB extends LightningElement {
	
	content;
	allData;
	relatedRecords;

	//for editing and deleting
	recordId;
	editObjectName;
	
	showmodal=false;

	opportunityColumns = [];
	contactColumns = [];

	//Pagination
	lstContacts;
	lstOpportunities;

	// Page Navigation
	conTotalRecords = 0; // Total no.of records
	pageSize = 6;
	conTotalPages; // Total no.of pages
	conPageNumber = 1; // Page number
	conOffset = 0;
	conRecordsToDisplay = []; // Records to be displayed on the page

	oppTotalRecords = 0; // Total no.of records
	oppTotalPages; // Total no.of pages
	oppPageNumber = 1; // Page number
	oppOffset = 0;
	oppRecordsToDisplay = []; // Records to be displayed on the page
	
	connectedCallback() {
		this.subscribeToMessageChannel();
	}
	
	disconnectedCallback() {
		this.unsubscribeToMessageChannel();
	}
	
	@wire(MessageContext)
	messageContext;
  
	subscribeToMessageChannel() {
		if (!this.subscription) {
			this.subscription = subscribe(
			this.messageContext,
			recordSelected,
			(recordId) => this.handleRecordId(recordId.recordId),
			{ scope: APPLICATION_SCOPE },
			);
		}
	}
	
	unsubscribeToMessageChannel() {
		unsubscribe(this.subscription);
		this.subscription = null;
	}

	handleRecordId(recordId){
		console.log('recieved recordId',recordId);
		this.content = recordId;
		this.getAllData();
		console.log('fetched');
	}
	
	handleClose() {
		this.close('done');
	}

	//Con methods
	get disableConPrevButtons() {
		return this.conPageNumber === 1;
	}

	// Disable next buttons when on last page
	get disableConNextButtons() {
		return this.conPageNumber === this.conTotalPages;
	}

	conPreviousPage() {
		this.conPageNumber -= 1;
		this.updateConNavigation();
	}

	conNextPage() {
		this.conPageNumber += 1;
		this.updateConNavigation();
	}

	conFirstPage() {
		this.conPageNumber = 1;
		this.updateConNavigation();
	}

	conLastPage() {
		this.conPageNumber = this.conTotalPages;
		this.updateConNavigation();
	}

	//Opp methods
	get disableOppPrevButtons() {
		return this.oppPageNumber === 1;
	}

	// Disable next buttons when on last page
	get disableOppNextButtons() {
		return this.oppPageNumber === this.oppTotalPages;
	}

	oppPreviousPage() {
		this.oppPageNumber -= 1;
		this.updateOppNavigation();
	}

	oppNextPage() {
		this.oppPageNumber += 1;
		this.updateOppNavigation();
	}

	oppFirstPage() {
		this.oppPageNumber = 1;
		this.updateOppNavigation();
	}

	oppLastPage() {
		this.oppPageNumber = this.oppTotalPages;
		this.updateOppNavigation();
	}

	updateOppNavigation() {
		// Removing all elements as they are reloaded on page change
		this.oppRecordsToDisplay = [];

		// Calculate offset
		this.oppOffset = (this.oppPageNumber - 1) * this.pageSize;

		// Calculate total pages
		this.oppTotalPages = Math.ceil(this.oppTotalRecords / this.pageSize);

		// Set page number
		if (this.oppPageNumber >= this.oppTotalPages) {
			this.oppPageNumber = this.oppTotalPages;
		}

		// Set records to display on current page
		for (let i = (this.oppPageNumber - 1) * this.pageSize; i < this.oppPageNumber * this.pageSize; i++) {
			if (i === this.oppTotalRecords) {
				break;
			}
			this.oppRecordsToDisplay.push(this.lstOpportunities[i]);
		}
		this.opportunityFielFetched = true;

	}

	updateConNavigation() {
		// Removing all elements as they are reloaded on page change
		this.conRecordsToDisplay = [];
		// Calculate offset
		this.conOffset = (this.conPageNumber - 1) * this.pageSize;

		// Calculate total pages
		this.conTotalPages = Math.ceil(this.conTotalRecords / this.pageSize);

		// Set page number
		if (this.conPageNumber >= this.conTotalPages) {
			this.conPageNumber = this.conTotalPages;
		}

		// Set records to display on current page
		for (let i = (this.conPageNumber - 1) * this.pageSize; i < this.conPageNumber * this.pageSize; i++) {
			if (i === this.conTotalRecords) {
				break;
			}
			this.conRecordsToDisplay.push(this.lstContacts[i]);
		}

		this.contactFielFetched = true;

	}


	handleConRowAction(event) {
		const action = event.detail.action;
		const row = event.detail.row;

		this.recordId = row.Id

		const selectedContact = this.relatedRecords.lstContacts.find(contactWrapper => contactWrapper.contact.Id === row.Id);

		switch (action.name) {
			case 'Edit':
				if (selectedContact.hasEditAccess) {
					this.editObjectName = 'Contact';
					this.editRecord();
				}
				else {
					const errorEvt = new ShowToastEvent({
						title: 'Task Failed',
						message: 'You dont have access to edit the record',
						variant: "error"
					});
					this.dispatchEvent(errorEvt);
				}
				break;

			case 'Delete':
				if (selectedContact.hasDeleteAccess) {
					this.confirmDelete();
				}
				else {
					const errorEvt = new ShowToastEvent({
						title: 'Task Failed',
						message: 'You dont have access to delete the record',
						variant: "error"
					});
					this.dispatchEvent(errorEvt);
				}
				break;
			default:
				console.log('default action');
		}
	}

	handleOppRowAction(event) {
		const action = event.detail.action;

		const row = event.detail.row;
		this.recordId = row.Id

		const selectedOpportunity = this.relatedRecords.lstOpportunities.find(opportunityWrapper => opportunityWrapper.opportunity.Id === row.Id);

		switch (action.name) {
			case 'Edit':
				if (selectedOpportunity.hasEditAccess) {
					this.editObjectName = 'Opportunity';
					// this.editRecord();
				}
				else {
					const errorEvt = new ShowToastEvent({
						title: 'Task Failed',
						message: 'You dont have access to edit the record',
						variant: "error"
					});
					this.dispatchEvent(errorEvt);
				}
				break;

			case 'Delete':
				if (selectedOpportunity.hasDeleteAccess) {
					this.confirmDelete();
				}
				else {
					const errorEvt = new ShowToastEvent({
						title: 'Task Failed',
						message: 'You dont have access to delete the record',
						variant: "error"
					});
					this.dispatchEvent(errorEvt);
				}
				break;
			default:
				console.log('default action');
		}
	}

	async editRecord() {
		console.log("Edit Done");

	}

	async confirmDelete() {
		console.log("Confirmbox delete");
		const result = await LightningConfirm.open({
			message: 'Are you sure you want to delete this record?',
			theme: 'error',
			label: 'Delete Confirmation'
		});

		if (result) {
			console.log("deleting");
			this.deleteRecord();
		}

	}

	deleteRecord() {

		deleteRecord({ 'recordId': this.recordId })
			.then(results => {

				if (results === 'deleted') {
					console.log("Delete Executed");
					const successEvt = new ShowToastEvent({
						title: 'Task SuccessFull',
						message: 'Record is Deleted',
						variant: "Success"
					});
					this.dispatchEvent(successEvt);
					this.getNewData();

				}
				else {
					const delErrorEvt = new ShowToastEvent({
						title: 'Task Failed',
						message: results,
						variant: "error"
					});
					this.dispatchEvent(delErrorEvt);
				}
			})
			.catch(error => {
				console.error(error);
			});
	}

	getAllData(){
		console.log('this.content', this.content);
		getAllAccountAndRelatedData({accId: this.content})
		.then(result => {

			const conResult = JSON.parse(result.contactFielset);

			conResult.forEach(item => {
				this.contactColumns.push({ label: item.label, fieldName: item.fieldPath });
			})

			const actions1 = [
				{ label: 'Edit', name: 'Edit' }, { label: 'Delete', name: 'Delete' }
			];
			this.contactColumns.push({ label: 'Action', type: 'action', typeAttributes: { rowActions: actions1, menuAlignment: 'right' } });

			const oppResult = JSON.parse(result.opportunityFieldset);

			oppResult.forEach(item => {
				this.opportunityColumns.push({ label: item.label, fieldName: item.fieldPath });
			});

			const actions2 = [
				{ label: 'Edit', name: 'Edit' }, { label: 'Delete', name: 'Delete' }
			];

			this.opportunityColumns.push({ label: 'Action', type: 'action', typeAttributes: { rowActions: actions2, menuAlignment: 'right' } });

			this.relatedRecords = result.accWrapper;

			this.lstContacts = this.relatedRecords.lstContacts.map(wrapper => wrapper.contact);
			this.conTotalRecords = this.lstContacts.length;
			this.updateConNavigation();

			this.lstOpportunities = this.relatedRecords.lstOpportunities.map(wrapper => wrapper.opportunity);
			this.oppTotalRecords = this.lstOpportunities.length;
			this.updateOppNavigation();

			this.showmodal=true;
		}).catch(error => {
			console.log("Error", JSON.stringify(error));
		});
	}

	getNewData(){
		getRelatedRec({ 'accId': this.content })
		.then(result => {
			this.relatedRecords = result;

			this.lstContacts = this.relatedRecords.lstContacts.map(wrapper => wrapper.contact);
			this.conTotalRecords = this.lstContacts.length;
			this.updateConNavigation();

			this.lstOpportunities = this.relatedRecords.lstOpportunities.map(wrapper => wrapper.opportunity);
			this.oppTotalRecords = this.lstOpportunities.length;
			this.updateOppNavigation();

		}).catch(error => {
			console.log("Error", JSON.stringify(error));
		});
	}
}