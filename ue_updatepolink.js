/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'],
    
    (record) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

            try {
                var newPORec = scriptContext.newRecord;
                log.debug('NEW PO', newPORec);
                var oldPORec = scriptContext.oldRecord;
                log.debug('OLD PO', oldPORec);

                var newPORecSOLink = newPORec.getValue('custbody_acs_related_so_number');

                var oldPORecSOLink = 0;
                if(oldPORec)
                    oldPORecSOLink = oldPORec.getValue('custbody_acs_related_so_number');

                log.debug('New PO Rec SO Link', newPORecSOLink);
                log.debug('Old PO Rec SO Link', oldPORecSOLink);

                if(newPORecSOLink != oldPORecSOLink){
                    if(newPORecSOLink){
                        log.debug('Selected SO', newPORecSOLink)
                        record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: newPORecSOLink,
                            values: {
                                'custbody_acs_related_po_number': newPORec.id
                            }
                            
                        })

                        if(oldPORecSOLink){
                            log.debug('Old SO remove PO link', oldPORecSOLink)
                            record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: oldPORecSOLink,
                                values: {
                                    'custbody_acs_related_po_number': null
                                }
                                
                            })
                        }
                        


                    } else {
                        log.debug('NULL SO Link', oldPORecSOLink);
                        record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: oldPORecSOLink,
                            values: {
                                'custbody_acs_related_po_number': null
                            }
                            
                        })
                    }
                    
                } else {
                            record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: oldPORecSOLink,
                                values: {
                                    'custbody_acs_related_po_number': newPORec.id
                                }
                                
                            })
                }

            } catch(err) {
                log.debug('Error', err)
            }
            

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
