/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/search', 'N/runtime'],
    
    (record, search, runtime) => {
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
            try{

                if(scriptContext.type == scriptContext.UserEventType.CREATE) {

                    var purchaseOrder = scriptContext.newRecord;
                    log.debug("PO", purchaseOrder)

                    var poDept = purchaseOrder.getValue('department');
                    log.debug('PO Dept', poDept);

                    var getItemCount = purchaseOrder.getLineCount({
                        sublistId: 'item'
                    });

                    var getExpenseCount = purchaseOrder.getLineCount({
                        sublistId: 'expense'
                    })

                    var expAccounts = []
                    var isInvtType = false;
                    var isNonInvt = false;

                    for(var i = 0; i < getItemCount; i++){

                        var itemID = purchaseOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'id',
                            line: i
                        })
                        log.debug('Item ID', itemID)

                        var itemType = purchaseOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        })
                        log.debug('Item Type', itemType);

                        var itmExpAccntID = purchaseOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_liq_itemexpaccount',
                            line: i
                        })
                        log.debug('Item ExpAccnt ID', itmExpAccntID)

                        if(itmExpAccntID){
                            var accntNum = search.lookupFields({
                                type: search.Type.ACCOUNT,
                                id: itmExpAccntID,
                                columns: 'number' 
                            });
                            log.debug('Item ExpAccount Number', accntNum.number)
        
                            expAccounts[i] = { 'accountnum': accntNum.number }
        
                        }
                        
                        if(itemType == 'InvtPart'|| itemType == 'Assembly'){
                            isInvtType = true;
                        } else if (itemType == 'NonInvtPart'){
                            isNonInvt = true
                        }
                    }

                    for(var i = 0; i < getExpenseCount; i++){
                        var accountId = purchaseOrder.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'account',
                            line: i
                        });
                        log.debug("Exp Id", accountId);
                        if(accountId){
                            var expAccntNum = search.lookupFields({
                                type: search.Type.ACCOUNT,
                                id: accountId,
                                columns: 'number'
                            });

                            expAccounts[expAccounts - 1] = { 'accountnum': expAccntNum.number }
                        }
                        
                    }

                    log.debug('ExpAccountNames', expAccounts)



                    log.debug('Exp Accounts', expAccounts)


                    const approversSearchObj = search.create({
                        type: "customrecord_lqd_po_approvers",
                        columns:
                        [
                        search.createColumn({
                            name: "name",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_LQD_APPROVERS",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "entityid",
                            join: "CUSTRECORD_LQD_APPROVERS",
                            label: "Name"
                        }),
                        search.createColumn({name: "custrecord_lqd_approver_lvl", sort: search.Sort.ASC, label: "Level"}),
                        search.createColumn({name: "custrecord_lqd_approver_limit", label: "Limit"})
                        ]
                    });

                    var poApprovers = {
                        'type': '',
                        'setup': []
                    };

                    //Department ID: 20(OPS: Supply Chain) in liquid
                    if(poDept == 20 && isInvtType && expAccounts.some(str => str.accountnum.startsWith('501'))){
                        //inventory
                        poApprovers.setup = approverSearch(approversSearchObj, poDept, isInvtType);
                        poApprovers.type = 'Invt';
                    } else if (isNonInvt && expAccounts.some(str => str.accountnum.startsWith('161')) || expAccounts.some(str => str.accountnum.startsWith('162'))){
                        //non-inventory capex
                        poApprovers.setup = approverSearch(approversSearchObj, "@NONE@", false);
                        poApprovers.type = 'CapEx';
                    } else {
                        //search by department
                        poApprovers.setup = approverSearch(approversSearchObj, poDept, false);
                        
                    }

                    log.debug('UE | Approvers', poApprovers);
                    purchaseOrder.setValue('custbody_lqd_po_approval_setting', JSON.stringify(poApprovers));

                    var poCreator = runtime.getCurrentUser();
                    log.debug('current user creating PO', poCreator)
                    purchaseOrder.setValue('custbody_lqd_po_creator', poCreator.id)
                }
            } catch(err){
                log.debug('Error', err)
                throw err.message;
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

        function approverSearch(searchObj, deptFilter, isInventory){
            //Apply filter on SavedSearch
            searchObj.filters.push(
                search.createFilter({
                    name: "custrecord_lqd_approver_department",
                    operator: search.Operator.ANYOF,
                    values: deptFilter
                })
            );

            //For OPS: Supply Chain with item type = Inventory/Assembly
            if(isInventory){
                searchObj.filters.push(
                    search.createFilter({
                        name: "custrecord_lqd_inventory_type",
                        operator: search.Operator.IS,
                        values: false
                    })
                );
            }
            
            var approvers = []
            var empCount = 0;
            //Iterate through buyer/creator and approvers
            searchObj.run().each(res => {
                //build employee info object
                var empInfo = { 
                    'empid': res.getValue(searchObj.columns[1]),
                    'empname': res.getValue(searchObj.columns[2]),
                    'lvl': res.getValue(searchObj.columns[3]),
                    'limit': res.getValue(searchObj.columns[4]),
                    'status': false
                }
                approvers[empCount] = empInfo;
                empCount++;
                return true;
             });
             log.debug('Approvers', approvers)

             return approvers; //pass approver list
        }


        return {beforeSubmit}

    });
