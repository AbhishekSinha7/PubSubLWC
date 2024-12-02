import { LightningElement, wire } from 'lwc';
import messageChannelName from "@salesforce/messageChannel/messageChannelName__c";

import { publish, MessageContext } from "lightning/messageService";
import getAccountData from "@salesforce/apex/Controller.getAccountData";

export default class ComponentA extends LightningElement {
	
	lstAcccounts = [];
    relatedRecords;
    accountColumns = [];

    // Page Navigation
    totalRecords = 0; // Total no.of records
    pageSize = 6;
    totalPages; // Total no.of pages
    pageNumber = 1; // Page number
    offset = 0;
    recordsToDisplay = []; // Records to be displayed on the page

	accountFethed=false;
	recordsFetched=false;

	get isReady(){
		if(this.accountFethed && this.recordsFetched){
			return true;
		}
		return false;
	}

	connectedCallback(){
		this.getAccountDatas();
	}

	@wire(MessageContext)
	messageContext;

	getAccountDatas(){
		getAccountData()
		.then(result => {
			//handling fielset data
			const conResult = JSON.parse(result.accountFieldsetData);
			conResult.forEach(item=>{
				this.accountColumns.push({label:item.label, fieldName:item.fieldPath});
			});
			const actions = [
				{ label: 'Show Details', name: 'show_details' }
			];
			this.accountColumns.push({ label: 'Action', type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'right' } });
			this.accountFethed=true;

			//handing data
			this.lstAcccounts = result.lstAcc;
			this.totalRecords = this.lstAcccounts.length;
			this.updateNavigation();
			this.recordsFetched=true;

		}).catch(error => {
			console.log("Error", JSON.stringify(error));
		});
	}

	// Disable previous buttons when on first page
	get disablePrevButtons() {
        return this.pageNumber === 1;
    }

    // Disable next buttons when on last page
    get disableNextButtons() {
        return this.pageNumber === this.totalPages;
    }

    previousPage() {
        this.pageNumber -= 1;
        this.updateNavigation();
    }

    nextPage() {
        this.pageNumber += 1;
        this.updateNavigation();
    }

    firstPage() {
        this.pageNumber = 1;
        this.updateNavigation();
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.updateNavigation();
    }

    updateNavigation() {
        // Removing all elements as they are reloaded on page change
        this.recordsToDisplay = [];

        // Calculate offset
        this.offset = (this.pageNumber - 1) * this.pageSize;

        // Calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        // Set page number
        if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }

        // Set records to display on current page
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.recordsToDisplay.push(this.lstAcccounts[i]);
        }

    }

	handleRowAction(event) {
		console.log('handled');
		const action = event.detail.action;
		let payload;

		switch (action.name) {
			case 'show_details':
				console.log('publishing');
				payload = { recordId: event.detail.row.Id };
				publish(this.messageContext, messageChannelName, payload);
				console.log('published');
				break;

			default:
				console.log('default action');
			}
		}
}