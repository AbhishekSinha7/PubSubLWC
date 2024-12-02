public without sharing class Controller {

	//wrapper for returning list of account fields and list of related records

	public class GetAccountData {
        @AuraEnabled
        public List<Account> lstAcc { get; set; }
        
        @AuraEnabled
        public String accountFieldsetData { get; set; }
    }

    public class AccountAndRelatedData {
        @AuraEnabled public AccountWrapper accWrapper { get; set; }
        @AuraEnabled public String contactFielset { get; set; }
        @AuraEnabled public String opportunityFieldset { get; set; }
    }

	public class AccountWrapper {
        @AuraEnabled public Id accountId { get; set; }
        @AuraEnabled public List<ContactWrapper> lstContacts { get; set; }
        @AuraEnabled public List<OpportunityWrapper> lstOpportunities { get; set; }
    }

	public class ContactWrapper {
        @AuraEnabled public Contact contact { get; set; }
        @AuraEnabled public Boolean hasEditAccess { get; set; }
        @AuraEnabled public Boolean hasDeleteAccess { get; set; }
    }

	public class OpportunityWrapper{
		@AuraEnabled public Opportunity opportunity {get; set;}
		@AuraEnabled public Boolean hasEditAccess { get; set; }
        @AuraEnabled public Boolean hasDeleteAccess { get; set; }
	}

    @AuraEnabled(cacheable=true)
    public static GetAccountData getAccountData() {
		GetAccountData getAcc = new GetAccountData();    		

		Schema.DescribeSObjectResult describeSObjectResultObj = Schema.getGlobalDescribe().get('Account').getDescribe();
		Schema.FieldSet accountFieldSet = describeSObjectResultObj.FieldSets.getMap().get('AccountFieldset');
		
		//changed from here
		getAcc.accountFieldsetData = JSON.serialize(accountFieldSet.getFields());

		List<String> fieldApiNames = new List<String>();
		for (Schema.FieldSetMember fieldSetMember : accountFieldSet.getFields()) {
			fieldApiNames.add(fieldSetMember.getFieldPath()); 
		}

		String fieldNames = string.join(fieldApiNames,',');
		
		List<Account> lstAccounts = Database.query(
													'SELECT '+
														fieldNames+' '+
													'FROM Account '+
													'LIMIT 50000'
												);
	
		getAcc.lstAcc = lstAccounts;

        return getAcc;
    }

    @AuraEnabled()
	public static AccountWrapper getRelatedRecords(Id accId) {

		AccountWrapper accountWrapper = new AccountWrapper();

        // Query to get Account, Contacts, and Opportunities
        List<Account> lstAcc = [
									SELECT 
										Id, 
										(
											SELECT 
												Id, OwnerId, Name, Phone, 
												Email, Birthdate, GenderIdentity,
												AccountId 
											FROM Contacts
										), 
										(
											SELECT 
												Id, OwnerId, Name, Amount, 
												CloseDate, LeadSource, StageName,
												AccountId
											FROM Opportunities
										) 
									FROM Account 
									WHERE Id =: accId
									LIMIT 50000
								];

		// For storing ids for checking user access
		List<Id> contactIds = new List<Id>();
		List<Id> opportunityIds = new List<Id>();

			Account acc = lstAcc[0];
            accountWrapper.accountId = acc.Id;

            accountWrapper.lstContacts = new List<ContactWrapper>();
            for (Contact con : acc.Contacts) {
                contactIds.add(con.Id);
				// Create ContactWrapper and add to the account wrapper
				ContactWrapper contactWrapper = new ContactWrapper();
				contactWrapper.contact = con;
				accountWrapper.lstContacts.add(contactWrapper);
            }

            accountWrapper.lstOpportunities = new List<OpportunityWrapper>();
            for (Opportunity opp : acc.Opportunities) {
                opportunityIds.add(opp.Id);
				// Create OpportunityWrapper and add to the account wrapper
				OpportunityWrapper opportunityWrapper = new OpportunityWrapper();
				opportunityWrapper.opportunity = opp; 
				accountWrapper.lstOpportunities.add(opportunityWrapper);
            }        

		// Fetch user access for Contacts and Opportunities
		Map<Id, UserRecordAccess> mapIdVsConAccess = RelatedRecordsModal.checkUserAccess(contactIds);
		Map<Id, UserRecordAccess> mapIdVsOppAccess = RelatedRecordsModal.checkUserAccess(opportunityIds);
		

			// For each ContactWrapper in accountWrapper.lstContacts, set access rights
			for (ContactWrapper contactWrapper : accountWrapper.lstContacts) {
				Contact con = contactWrapper.contact; 
                if (mapIdVsConAccess.containsKey(con.Id)) {
                    UserRecordAccess access = mapIdVsConAccess.get(con.Id);
                    contactWrapper.hasEditAccess = access.HasEditAccess;
                    contactWrapper.hasDeleteAccess = access.HasDeleteAccess;
                }
            }

			// For each OpportunityWrapper in accountWrapper.lstOpportunities, set access rights
			for (OpportunityWrapper opportunityWrapper : accountWrapper.lstOpportunities) {
				Opportunity opp = opportunityWrapper.opportunity;
                if (mapIdVsOppAccess.containsKey(opp.Id)) {
                    UserRecordAccess access = mapIdVsOppAccess.get(opp.Id);
                    opportunityWrapper.hasEditAccess = access.HasEditAccess;
                    opportunityWrapper.hasDeleteAccess = access.HasDeleteAccess;
                }
            }

		return accountWrapper;
	}

	@AuraEnabled()
	public static AccountAndRelatedData getAllAccountAndRelatedData(Id accId ) {
		AccountAndRelatedData  accRelatedWrapper = new AccountAndRelatedData();

		Schema.DescribeSObjectResult describeSObjectResultObj1 = Schema.getGlobalDescribe().get('Contact').getDescribe();
		Schema.FieldSet fielsetInstance1 = describeSObjectResultObj1.FieldSets.getMap().get('ContactFieldset');
		accRelatedWrapper.contactFielset =  JSON.serialize(fielsetInstance1.getFields());

		Schema.DescribeSObjectResult describeSObjectResultObj2 = Schema.getGlobalDescribe().get('Opportunity').getDescribe();
		Schema.FieldSet fielsetInstance2 = describeSObjectResultObj2.FieldSets.getMap().get('OpportunitytFieldset');
		accRelatedWrapper.opportunityFieldset =  JSON.serialize(fielsetInstance2.getFields());
			
		// AccountWrapper accountWrapper = RelatedRecordsModal.getRelatedRecords(accId);
		AccountWrapper accountWrapper = new AccountWrapper();

        // Query to get Account, Contacts, and Opportunities
        List<Account> lstAcc = [
									SELECT 
										Id, 
										(
											SELECT 
												Id, OwnerId, Name, Phone, 
												Email, Birthdate, GenderIdentity,
												AccountId 
											FROM Contacts
										), 
										(
											SELECT 
												Id, OwnerId, Name, Amount, 
												CloseDate, LeadSource, StageName,
												AccountId
											FROM Opportunities
										) 
									FROM Account 
									WHERE Id =: accId
									LIMIT 50000
								];

		// For storing ids for checking user access
		List<Id> contactIds = new List<Id>();
		List<Id> opportunityIds = new List<Id>();

			Account acc = lstAcc[0];
            accountWrapper.accountId = acc.Id;

            accountWrapper.lstContacts = new List<ContactWrapper>();
            for (Contact con : acc.Contacts) {
                contactIds.add(con.Id);
				// Create ContactWrapper and add to the account wrapper
				ContactWrapper contactWrapper = new ContactWrapper();
				contactWrapper.contact = con;
				accountWrapper.lstContacts.add(contactWrapper);
            }

            accountWrapper.lstOpportunities = new List<OpportunityWrapper>();
            for (Opportunity opp : acc.Opportunities) {
                opportunityIds.add(opp.Id);
				// Create OpportunityWrapper and add to the account wrapper
				OpportunityWrapper opportunityWrapper = new OpportunityWrapper();
				opportunityWrapper.opportunity = opp; 
				accountWrapper.lstOpportunities.add(opportunityWrapper);
            }        

		// Fetch user access for Contacts and Opportunities
		Map<Id, UserRecordAccess> mapIdVsConAccess = RelatedRecordsModal.checkUserAccess(contactIds);
		Map<Id, UserRecordAccess> mapIdVsOppAccess = RelatedRecordsModal.checkUserAccess(opportunityIds);
		

			// For each ContactWrapper in accountWrapper.lstContacts, set access rights
			for (ContactWrapper contactWrapper : accountWrapper.lstContacts) {
				Contact con = contactWrapper.contact; 
                if (mapIdVsConAccess.containsKey(con.Id)) {
                    UserRecordAccess access = mapIdVsConAccess.get(con.Id);
                    contactWrapper.hasEditAccess = access.HasEditAccess;
                    contactWrapper.hasDeleteAccess = access.HasDeleteAccess;
                }
            }

			// For each OpportunityWrapper in accountWrapper.lstOpportunities, set access rights
			for (OpportunityWrapper opportunityWrapper : accountWrapper.lstOpportunities) {
				Opportunity opp = opportunityWrapper.opportunity;
                if (mapIdVsOppAccess.containsKey(opp.Id)) {
                    UserRecordAccess access = mapIdVsOppAccess.get(opp.Id);
                    opportunityWrapper.hasEditAccess = access.HasEditAccess;
                    opportunityWrapper.hasDeleteAccess = access.HasDeleteAccess;
                }
            }

		accRelatedWrapper.accWrapper = accountWrapper;

		return accRelatedWrapper;
	}

	@AuraEnabled(cacheable=true)
    public static String getFielsetFields(String objectName, String fieldSetName) {

		Schema.DescribeSObjectResult describeSObjectResultObj = Schema.getGlobalDescribe().get(objectName).getDescribe();

		Schema.FieldSet fielsetInstance = describeSObjectResultObj.FieldSets.getMap().get(fieldSetName);

		return JSON.serialize(fielsetInstance.getFields());
    }

	@AuraEnabled()
    public static Map<Id, UserRecordAccess> checkUserAccess(List<Id> lstId) {
		// List<UserRecordAccess> lstUra = new List<UserRecordAccess>();

        Map<Id, UserRecordAccess> mapIdVsAccess = new Map<Id, UserRecordAccess>([
            SELECT RecordId, HasEditAccess, HasDeleteAccess 
            FROM UserRecordAccess 
            WHERE UserId = :UserInfo.getUserId()
            AND RecordId IN :lstId
        ]);

		return mapIdVsAccess;
    }

	@AuraEnabled()
    public static String deleteRecord(Id recordId) {
		String errors = '';
		
		Database.deleteResult delResult = Database.delete(recordId, false);
		if (!delResult.isSuccess()) {
			for(Database.Error err : delResult.getErrors()) {
				errors = errors + err.getMessage();
			}
			return errors;
		}		

		return 'deleted';
    }
}