/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record','N/runtime'],

    (record, runtime) => {
        var poTotal = 0;
        var purchaseOrder;
        var poCreator;
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

                purchaseOrder = scriptContext.newRecord;
                log.debug('WF | PO', purchaseOrder)

                poTotal = purchaseOrder.getValue('total');
                log.debug('PO Total', poTotal);

                poCreator = purchaseOrder.getValue('custbody_lqd_po_creator')
                log.debug('current user', poCreator)

                var department = purchaseOrder.getValue('department');
                log.debug('Department', department)

                var aplist = purchaseOrder.getValue('custbody_lqd_po_approval_setting');
                aplist = JSON.parse(aplist);
                log.debug("Approvers", aplist)
                
                var isAutoApproved = false;
                isAutoApproved = assignApprover(aplist);
                
                //Check remaining approver status excluding buyer/creator(lvl = 5)
                var approverChecker = aplist['setup'].filter(x => x.status == false && x.lvl != 5).length;
                log.debug("Approver Checker", approverChecker);
                //Set isComplete = true if PO is Auto Approved or no remaining approver
                isCompleted = !isAutoApproved ?  (approverChecker > 0 ? false : true) : true;
                log.debug('isCompleted', isCompleted)
                if(!isCompleted) // return false if PO approval is not complete
                    return 0;

                return 1; // return true if PO is complete

            } catch(err) {
                log.debug("Error", err.message)
                //throw err.message;
            }
            
        }

        

        function assignApprover(aplist){
                var forceComplete = false;
                //get PO Creator
                var buyer = aplist['setup'].filter(x => x.empid == poCreator && x.lvl == 5);
                log.debug('PO Buyer/Creator', buyer);
                
                //Check if buyer has approval limit, 
                //if buyer/creator has limit and PO Total is less than or equal to buyer/creator limit, PO is AUTO APPROVED
                if(buyer.length > 0 && buyer[0].limit != " " && poTotal <= buyer[0].limit){
                    log.debug('AUTO APPROVED', "YES")
                    return true;

                } else {
                    var nextApprover = purchaseOrder.getValue('nextapprover'); //Get Assigned Next Approver
                    log.debug('Next Approver Value', nextApprover)
                    //Check if nextapprover field is empty(nextapprover = -1)
                    if(nextApprover == -1 || nextApprover == null || nextApprover == '') {
                        //Next Approver is Empty means no next approver is assigned yet
                        var poApprover = aplist['setup'].filter(x => x.lvl == 1); //Get first level 1 approver
                        log.debug('First Approver', poApprover[0].empid)
                        purchaseOrder.setValue('nextapprover', poApprover[0].empid)

                    } else { //if nextapprover field is not empty, check nextapprover on approver list
                        
                        var list = aplist['setup'].filter(x => x.lvl != 5); //exclude buyer/creator on list
                        log.debug('Get Approver List', list)

                        

                        //check nextapprover(employee id) on list and get status
                        var currentApprover = list.filter(x => x.empid == nextApprover); 
                        log.debug('Is Approved by', currentApprover);
                        if(currentApprover.length > 0 && currentApprover[0].status){ //if nextapprover has approved the PO:
                            
                            
                            list.every(emp => { //iterate through approvers from lvl 1 to last approver
                                log.debug('Candidate Approver', emp)
                                if(emp.status == true)
                                    return true;

                                if(forceComplete)
                                    return true;

                               
                                if(currentApprover[0].limit <= poTotal && emp.limit <= poTotal){
                                    log.debug('1st Check', emp.empid)
                                    nextApprover = emp.empid // assign approver
                                    return false;
                                } else if(currentApprover[0].limit <= poTotal && poTotal <= emp.limit) {
                                    log.debug('2nd Check', emp.empid)
                                    nextApprover = emp.empid
                                    return false;
                                } else if(currentApprover[0].limit <= poTotal && emp.limit == '' || emp.limit == null) {
                                    log.debug('Assign No Limit', emp.empid)
                                    nextApprover = emp.empid;
                                    return false;
                                } else {
                                    log.debug('forceComplete', true)
                                    forceComplete = true; //force complete PO with total exceeding next approver limit
                                    return false;
                                }
    
                            });

                            if(forceComplete)
                                return true;

                            log.debug('New Approver', nextApprover);
                            purchaseOrder.setValue('nextapprover', nextApprover)

                        } else { //Current Approver did not approve PO yet, do not update nextapprover field
                            log.debug('Pending Approval by:', nextApprover);
                        }

                    }
                }

                return false;

        }

     

        return {onAction};
    });
