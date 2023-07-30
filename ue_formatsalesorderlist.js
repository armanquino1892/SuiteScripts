/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget','N/search', 'N/runtime'],
    
    (serverWidget, search, runtime) => {
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
            try {
                var rec = scriptContext.newRecord;
                if(scriptContext.type !== scriptContext.UserEventType.VIEW) {
                    
                    log.debug('Context', scriptContext.type)
                    var form = scriptContext.form
                    log.debug('Form', form)

                    var sublist = form.getSublist({
                        id: 'item'
                    })

                    var selectField = sublist.addField({
                        id: 'custpage_acs_solink',
                        label: 'Sales Order #',
                        type: serverWidget.FieldType.SELECT
                    })

                    var salesorderSearchObj = search.create({
                        type: "salesorder",
                        filters:
                        [
                        ["type","anyof","SalesOrd"], 
                        "AND", 
                        ["mainline","is","T"]
                        ],
                        columns:
                        [
                        search.createColumn({
                            name: "tranid",
                            sort: search.Sort.ASC,
                            label: "Document Number"
                        }),
                        search.createColumn({name: "entity", label: "Name"})
                        ]
                    });
                    var searchResultCount = salesorderSearchObj.runPaged().count;
                    log.debug("salesorderSearchObj result count",searchResultCount);
                    var result = salesorderSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results

                        selectField.addSelectOption({
                            value: result['id'],
                            text: '#' + result.getValue('tranid'), //Document Number
                            isSelected: false
                        })
                        return true;
                    });

                    var poItemCount = rec.getLineCount({
                        sublistId: 'item'
                    })

                    for(var i = 0; i < poItemCount; i++){
                        var soLinkFldID = rec.getSublistField({
                            sublistId: 'item',
                            fieldId: 'custcol_acs_so_link',
                            line: i
                        })
                        log.debug('soLinkFldID', soLinkFldID)
                    }
                
                }
            } catch(error) {
                log.debug('Error', error)
            }
            
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
            var poRec = scriptContext.newRecord;
               try{
                var poItemCount = poRec.getLineCount({
                    sublistId: 'item'
                })

                for(var i = 0; i < poItemCount; i++){
                    var soID = poRec.getSublistValue({
                        line: i,
                        fieldId: 'custpage_acs_solink',
                        sublistId: 'item'
                    });

                    var soDocNum = poRec.getSublistText({
                        line: i,
                        fieldId: 'custpage_acs_solink',
                        sublistId: 'item'
                    })
                    log.debug('DOC NUM', soDocNum)

                  log.debug("SO ID", soID)
                  poRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_acs_so_link',
                        line: i,
                        value: soID
                    });
                  
                    poRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol1',
                        line: i,
                        value: '<a href=https://system.netsuite.com/app/accounting/transactions/salesord.nl?id=' || soID || '>LINK</a>'
                    })

                }

            }catch(err){
                log.debug('Error', err)
            }

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

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
