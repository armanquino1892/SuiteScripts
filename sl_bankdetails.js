/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/url', 'N/redirect', 'N/runtime', 'N/search', 'N/record', 'N/ui/message', 'N/email', 'N/format'],
    
    (serverWidget, url, redirect, runtime, search, record, message, email, format) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var request = scriptContext.request;
            var response = scriptContext.response;

            try{

                var form = serverWidget.createForm({
                    title: "Update Bank Information"
                });
                form.clientScriptFileId = 317251;

                if(request.parameters.page_status == "saved"){
                    form.addPageInitMessage({
                        type: message.Type.INFORMATION,
                        title: 'Bank Details Saved!',
                        message: 'Your bank details has been updated',
                        duration: 15000
                    });
                }
                
                var vendorUser = runtime.getCurrentUser();
                log.debug('Current Vendor', vendorUser)

                var scriptObj = runtime.getCurrentScript();
                var emailBody = scriptObj.getParameter({name: "custscript_asucla_email_body_param"});
                log.debug('Email Body', emailBody)

                var defaultSender = scriptObj.getParameter({name: "custscript_asucla_default_sender"});
                log.debug('Default Sender', defaultSender)
                var defaultRecipient = scriptObj.getParameter({name: "custscript_asucla_default_recipient"});
                log.debug('Default Recipient', defaultRecipient)

                var isEFTPayment = search.lookupFields({
                    type: search.Type.VENDOR,
                    id: vendorUser.id,
                    columns: ["custentity_2663_payment_method"]
                })
                log.debug("isEFTPayment", isEFTPayment.custentity_2663_payment_method);

                var isDenied = false;
                if(!isEFTPayment.custentity_2663_payment_method){
                    isDenied = true;
                    form.addPageInitMessage({
                        type: message.Type.WARNING,
                        title: 'Access Denied!',
                        message: 'You are not authorized to access this page'
        
                    });
                } 

                var vendorBankSearchObj = search.create({
                    type: 'customrecord_2663_entity_bank_details',
                    columns: ['name', 'custrecord_2663_entity_acct_no', 'custrecord_2663_entity_bank_no']
                });
                vendorBankSearchObj.filters.push(
                    search.createFilter({
                        name: "custrecord_2663_parent_vendor",
                        operator: search.Operator.ANYOF,
                        values: vendorUser.id
                    })
                );

                var resultCount = vendorBankSearchObj.runPaged().count;
                var vendorBankDetailsID = 0;
                var vendorBankName = "";
                var vendorBankRoutingNum = "";
                var vendorBankAccountNum = "";
                vendorBankSearchObj.run().each((res)=>{ 
                    log.debug('Result', res)
                    vendorBankDetailsID = res.id;
                    vendorBankName = res.getValue('name');
                    vendorBankRoutingNum = res.getValue('custrecord_2663_entity_bank_no');
                    vendorBankAccountNum = res.getValue('custrecord_2663_entity_acct_no');
                })
                log.debug("Search Result", resultCount)


                if (request.method === "GET") { // GET

                    if(!isDenied){

                        form.addFieldGroup({
                            id: 'custpage_field_grp1',
                            label: 'Current Bank Details'
                        })

                        form.addFieldGroup({
                            id: 'custpage_field_grp2',
                            label: 'Bank Details'
                        })

                        form.addFieldGroup({
                            id: 'custpage_field_grp3',
                            label: ' '
                        })

                        var curBankName = form.addField({ id: "custpage_cur_bankname", type: serverWidget.FieldType.TEXT, label: "Bank Name:", container: 'custpage_field_grp1' });
                        curBankName.defaultValue = vendorBankName;
                        curBankName.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        var curBankAccountNum = form.addField({ id: "custpage_cur_banknum", type: serverWidget.FieldType.TEXT, label: "Bank Account Number:", container: 'custpage_field_grp1' });
                        curBankAccountNum.defaultValue = vendorBankAccountNum;
                        curBankAccountNum.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        var curBankRoutingNum = form.addField({ id: "custpage_cur_routingnum", type: serverWidget.FieldType.TEXT, label: "Bank Routing Number:", container: 'custpage_field_grp1' });
                        curBankRoutingNum.defaultValue = vendorBankRoutingNum;
                        curBankRoutingNum.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        

                        var vendorID = form.addField({ id: "custpage_header", type: serverWidget.FieldType.TEXT, label: "Vendor ID:", container: 'custpage_field_grp2' });
                        vendorID.defaultValue = vendorUser.name;
                        vendorID.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        var bankType = form.addField({ id: "custpage_bank_type", type: serverWidget.FieldType.TEXT, label: "Type:", container: 'custpage_field_grp2' });
                        bankType.defaultValue = "Primary";
                        bankType.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        var paymentFileFormat = form.addField({ id: "custpage_payment_file_format", type: serverWidget.FieldType.TEXT, label: "Payment File Format:", container: 'custpage_field_grp2' });
                        paymentFileFormat.defaultValue = "ACH-CCD/PPD";
                        paymentFileFormat.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        var subsidiaryfld = form.addField({ id: "custpage_subsidiary", type: serverWidget.FieldType.TEXT, label: "Subsidiary:", container: 'custpage_field_grp2' });
                        subsidiaryfld.defaultValue = "Services and Enterprises";
                        subsidiaryfld.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });
                        
                        var bankNameFld = form.addField({
                            id: "custpage_asucla_bankname",
                            label: "Enter Bank Name:",
                            type: serverWidget.FieldType.TEXT,
                            container: 'custpage_field_grp2'
                        });
                        bankNameFld.isMandatory = true;

                        var routingNumFld = form.addField({
                            id: "custpage_asucla_routingnum",
                            label: "Enter Routing Number:",
                            type: serverWidget.FieldType.TEXT,
                            container: 'custpage_field_grp2'
                        });
                        routingNumFld.isMandatory = true;

                        var routingNumChkFld = form.addField({
                            id: "custpage_asucla_routingnum_chk",
                            label: "Re-enter Routing Number:",
                            type: serverWidget.FieldType.TEXT,
                            container: 'custpage_field_grp2'
                        });
                        routingNumChkFld.isMandatory = true;

                        var accountNumFld = form.addField({
                            id: "custpage_asucla_accntnum",
                            label: "Enter Account Number:",
                            type: serverWidget.FieldType.TEXT,
                            container: 'custpage_field_grp2'
                        });
                        accountNumFld.isMandatory = true;

                        var accountNumChkFld = form.addField({
                            id: "custpage_asucla_accntnum_chk",
                            label: "Re-enter Account Number:",
                            type: serverWidget.FieldType.TEXT,
                            container: 'custpage_field_grp2'
                        });
                        accountNumChkFld.isMandatory = true;

                        var accntTypeFld = form.addField({
                            id: "custpage_asucla_account_type",
                            label: "Account Type:",
                            type: serverWidget.FieldType.SELECT,
                            container: 'custpage_field_grp2',
                            source: 66

                        });
                        accntTypeFld.isMandatory = true;

                        var fileUploadFld = form.addField({
                            id: "custpage_asucla_file_upload",
                            label: "Please Upload a copy of a voided check:",
                            type: serverWidget.FieldType.FILE
                        });
                        fileUploadFld.isMandatory = true;

                        var authorizeChkBoxFld = form.addField({ 
                            id: "custpage_asucla_auth_checbox", 
                            type: serverWidget.FieldType.CHECKBOX, 
                            label: " ", 
                            container: 'custpage_field_grp2' 
                        });

                        authorizeChkBoxFld.updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.OUTSIDE
                        });
                        
                        authorizeChkBoxFld.updateBreakType({
                            breakType : serverWidget.FieldBreakType.STARTROW
                        });

                        authorizeChkBoxFld.isMandatory = true;

                        var htmlAuthText = form.addField({
                            id: 'custpage_asucla_html_text',
                            type: serverWidget.FieldType.INLINEHTML,
                            label: ' ',
                            container: 'custpage_field_grp2'
                        }).updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.OUTSIDE
                        }).updateBreakType({
                            breakType: serverWidget.FieldBreakType.STARTCOL
                        }).defaultValue = "<p style=\'font-size:14px\'><strong>I hereby authorize Associated Students UCLA, hereinafter called COMPANY, to initiate credit " +
                        "entries to the above mentioned bank account for <i>" + vendorUser.name + "</i>, hereafter " +
                        "called DEPOSITORY, and to credit the same to such account, and if necessary, debit entries and " +
                        "adjustments for any credit entries made in error. I acknowledge that the origination of ACH " +
                        "transactions to this account must comply with the provisions of U.S. law. This authorization will " +
                        "remain in full force and effect until COMPANY has received written notification to cancel this " +
                        "authorization from DEPOSITORY</strong></p>";

                        //Person Completing the form
                        var nameOfUserFld = form.addField({
                            id: "custpage_asucla_person_name",
                            label: "Name: ",
                            type: serverWidget.FieldType.TEXT,
                            container: 'custpage_field_grp2'
                        });
                        nameOfUserFld.isMandatory = true;
                        nameOfUserFld.maxLength = 64;
                        nameOfUserFld.setHelpText({
                            help : "Name of person completing the form."
                        });
                        nameOfUserFld.updateLayoutType({
                            layoutType: serverWidget.FieldLayoutType.OUTSIDE
                        });
                        
                        nameOfUserFld.updateBreakType({
                            breakType : serverWidget.FieldBreakType.STARTROW
                        });
                

                        var submitBtn = form.addSubmitButton({
                            label: "Save"
                        });
                    }
        
                    response.writePage(form);

                } else {
                    log.debug('Save Triggered', 'Save Triggered')
                    var bankName = request.parameters.custpage_asucla_bankname;
                    var routingNum = request.parameters.custpage_asucla_routingnum;
                    var accntNum = request.parameters.custpage_asucla_accntnum;
                    var accountType = request.parameters.custpage_asucla_account_type;
                    var updatedBy = request.parameters.custpage_asucla_person_name;
                    var fileObj = request.files.custpage_asucla_file_upload;
                    log.debug('File Obj', fileObj);

                    var currentDate = new Date();
                    var dateFormatted = format.format({ value: currentDate, type: format.Type.DATE })
                    log.debug('Date Today', dateFormatted);

                    if(resultCount > 0){
                        var recId = record.submitFields({
                            type: 'customrecord_2663_entity_bank_details',
                            id: vendorBankDetailsID,
                            values: {
                                'custrecord_2663_parent_vendor': vendorUser.id,
                                'name': bankName,
                                'custrecord_2663_entity_acct_no': accntNum,
                                'custrecord_2663_entity_bank_no': routingNum,
                                'custrecord_2663_entity_bank_type': 1, //Primary
                                'custrecord_2663_entity_file_format': 13, //ACH-CCD/PPD
                                'custrecord_9572_subsidiary': 2,
                                'custrecord_2663_entity_bank_acct_type': accountType
                            }
                        });
                        log.debug('Record Saved', recId);

                        record.submitFields({
                            type: record.Type.VENDOR,
                            id: vendorUser.id,
                            values: {
                                'custentity_asucla_bankinfo_lastupdateby': "Name: " + updatedBy + " Date: " + dateFormatted
                            }
                        })

                        fileObj.name = vendorUser.id + "." + fileObj.name.split('.').pop();
                        fileObj.folder = 237486;
                        fileObj.save();

                    } else {


                        //Create Entity Bank Details for Vendor
                        var entityBankRec = record.create({
                            type: 'customrecord_2663_entity_bank_details',
                            isDynamic: true
                        })

                        entityBankRec.setValue({
                            fieldId: 'custrecord_2663_parent_vendor',
                            value: vendorUser.id
                        })

                        entityBankRec.setValue({
                            fieldId: 'name',
                            value: bankName
                        });

                        entityBankRec.setValue({
                            fieldId: 'custrecord_2663_entity_acct_no',
                            value: accntNum
                        });

                        entityBankRec.setValue({
                            fieldId: 'custrecord_2663_entity_bank_no',
                            value: routingNum
                        });

                        entityBankRec.setValue({
                            fieldId: 'custrecord_2663_entity_bank_acct_type',
                            value: accountType
                        })

                        //Primary
                        entityBankRec.setValue({
                            fieldId: 'custrecord_2663_entity_bank_type',
                            value: 1
                        });

                        //ACH-CCD/PPD
                        entityBankRec.setValue({
                            fieldId: 'custrecord_2663_entity_file_format',
                            value: 13
                        });

                        //Services and Enterprises
                        entityBankRec.setValue({
                            fieldId: 'custrecord_9572_subsidiary',
                            value: 2
                        });


                        entityBankRec.save();
                        
                        fileObj.name = vendorUser.id + "." + fileObj.name.split('.').pop();
                        fileObj.folder = 237486;
                        fileObj.save();
                    }

                    emailBody += "<br><br> Bank Information Update Authorized By: " + updatedBy

                    email.send({
                        author: defaultSender,
                        body: emailBody,
                        recipients: defaultRecipient,
                        subject: '[NOTICE] Bank Information Update for Vendor: ' + vendorUser.name
                    })
                    

                    var params = { page_status: 'saved' };
                    var suiteletURL = url.resolveScript({
                        scriptId: 'customscript_asucla_sl_bankdetails',
                        deploymentId: 'customdeploy_asucla_sl_bankdetails',
                        params: params
                    });
                    redirect.redirect({ url: suiteletURL });

                    
                }
    
                

            } catch(err){
                log.debug('Error', err)
            }
            

        }

        return {onRequest}

    });
