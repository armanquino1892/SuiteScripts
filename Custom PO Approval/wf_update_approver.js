/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/runtime','N/record'],
    
    (runtime, record) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {
            try{
                var purchaseOrder = scriptContext.newRecord;
                log.debug('PO', purchaseOrder);
                
                //Get PO record's approval settings
                var aplist = purchaseOrder.getValue('custbody_lqd_po_approval_setting');
                aplist = JSON.parse(aplist);
                log.debug('Approval list', aplist)

                //Get Current User = Approver
                var currentUser = runtime.getCurrentUser();
                log.debug('Current User', currentUser)

                //Find Approver Employee ID on approver list
                var index = aplist['setup'].findIndex(x => x.empid == currentUser.id && x.lvl != 5);
                log.debug('Aplist index', index);

                if(index != -1){ //if Approver exist on approver list:
                    //Set approver status = true
                    aplist['setup'][index].status = true;
                    var udpatedApprovers = JSON.stringify(aplist);

                    //Updated PO approver list
                    log.debug('Updated List', udpatedApprovers) 
                    purchaseOrder.setValue('custbody_lqd_po_approval_setting', udpatedApprovers);

                    return 1; // return True
                }
            
                return 0; //return False

            } catch(err){
                log.debug('Error', err.message)
                throw err.message
            }
            

        }

        return {onAction};
    });
