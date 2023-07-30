/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/email', 'N/runtime', 'N/record', 'N/search', 'N/render'],
    
    (email, runtime, record, search, render) => {
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
            try {

            var currentUser = runtime.getCurrentUser();
            log.debug('Current User', currentUser)

            var soRec = scriptContext.newRecord;
            log.debug('Sales Order', soRec)

            var customeremails = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: soRec.getValue('entity'),
                columns: ['custentity_acs_so_emailaddresses'] //custom field holding multiple email addresses
            })

            var soEmailList = customeremails.custentity_acs_so_emailaddresses.split(';');
            log.debug('SO Email List', soEmailList);
            var transactionFile = render.transaction({
                entityId: soRec.id,
                printMode: render.PrintMode.PDF,
                inCustLocale: false
            })
            log.debug('Transaction File', transactionFile)

            var htmlBody = "Dear customer,  <br><br>" +
            "Attached is a copy of your sales order for the purchase order referenced. <br>" +
            "Please let us know if you have any questions.";

            email.sendBulk({
                author: currentUser.id,
                body: htmlBody,
                recipients: soEmailList,
                subject: "PO#: "+ soRec.getValue('otherrefnum') + " - Order confirmation",
                attachments: [transactionFile],
              relatedRecords: {
                transactionId: soRec.id
              }
            })

            } catch(err){
                log.debug('Error', err)
            }
            
        }

        return {onAction};
    });
