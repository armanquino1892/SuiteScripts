/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/runtime', 'N/render', 'N/email'],
    
    (runtime, render, email) => {
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

                var defaultSender = runtime.getCurrentScript().getParameter('custscript1');
                log.debug('Default Sender', defaultSender)
    
                var customer = scriptContext.newRecord;
                log.debug('customer', customer)

                var billingEmail = customer.getValue('custentity3');
                log.debug('Billing emails', billingEmail)
                var statementEmail = customer.getValue('custentity10');
                log.debug('Statement emails', statementEmail)

    
                var billingEmailList = billingEmail.split(';');
                log.debug('Billing Email List', billingEmailList);

                var statementEmailList = statementEmail.split(';');
                log.debug('Statement Email List', statementEmailList)

                var daysOverdue = customer.getValue('daysoverdue');

                if(daysOverdue <= 30){
                    log.debug('Overdue < 30', daysOverdue)
                    // template = record.load({
                    //     type: record.Type.EMAIL_TEMPLATE,
                    //     id: //TBA
                    // })

                } else {
                    log.debug('Overdue >= 31', daysOverdue)
                    // template = record.load({
                    //     type: record.Type.EMAIL_TEMPLATE,
                    //     id: //TBA
                    // })
                } 
    
                //Customer Statement
                var custstatement = render.statement({
                    entityId: customer.id,
                    printMode: render.PrintMode.PDF,
                    inCustLocale: false,
                    openTransactionsOnly: true,
                    startDate: null
                })
                log.debug('Transaction File', custstatement)
    
                // Send Email
                var isSent = email.send({
                    author: defaultSender,
                    body: 'Email Body',
                    recipients: billingEmailList,
                    subject: 'Email Subject',
                    attachments: [custstatement]
                })
                log.debug('Is Email Sent', isSent)

                } catch(err){
                    log.debug('Error', err)
                }
            
        }

        return {onAction};
    });
