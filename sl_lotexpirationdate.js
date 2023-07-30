/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record'],
    
    (record) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                log.debug('Request', scriptContext.request.parameters)
                var internalId = scriptContext.request.parameters.id;
                
    
              log.debug('Internal ID', internalId);
              var ifRec = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: internalId,
                isDynamic: false
              });

              log.debug('Item Fulfillment', ifRec);
              var items = ifRec.getLineCount({
                sublistId: 'item'
              });

              var itemInvtyDetailList = {};
              for(var i = 0; i < items; i++) {

                var itemId = ifRec.getSublistValue({
                    line: i,
                    fieldId: 'item',
                    sublistId: 'item'
                });

                var lineuniquekey = ifRec.getSublistValue({
                  line: i,
                  fieldId: 'line',
                  sublistId: 'item'
               });
               log.debug('Line', lineuniquekey)

                var invtyDetail = ifRec.getSublistSubrecord({
                    line: i,
                    fieldId: 'inventorydetail',
                    sublistId: 'item'
                });
                log.debug('Inventory Detail_'+i, invtyDetail)

                
                if(invtyDetail!='') {
                  assignedInvtyCt = invtyDetail.getLineCount({sublistId: 'inventoryassignment'});
                  log.debug("assignedInvtyCt",assignedInvtyCt);
                  if(assignedInvtyCt > 0) {
                    var lotExpDetail = {};
                    var prevQty = 0;
                    for(var a = 0; a < assignedInvtyCt; a++) {
                      var curLotNum = invtyDetail.getSublistText({sublistId: 'inventoryassignment',fieldId:'issueinventorynumber',line: a});
                      var curLotQTY = invtyDetail.getSublistValue({sublistId: 'inventoryassignment',fieldId:'quantity',line: a});
                      var curLotExp = invtyDetail.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        line: a
                      })
                     
                      if(typeof lotExpDetail[curLotNum] == 'undefined') {
                        lotExpDetail[curLotNum] = "";
                      }

                      var dateStr = '';
                      if(curLotExp) {
                         dateStr = " : " + curLotExp.toLocaleDateString()
                      }

                      if(lotExpDetail.hasOwnProperty(curLotNum) && lotExpDetail[curLotNum] != ""){
                        log.debug('LotExpDetail', lotExpDetail);
                        let oldValue = lotExpDetail[curLotNum];

                        log.debug('OldValue', oldValue.match(/\((\d+)\)/)[1]);
                        let number = parseInt(oldValue.match(/\((\d+)\)/)[1]);

                        let updatedQTY = number + curLotQTY;
                        lotExpDetail[curLotNum] = oldValue.replace(/\(\d+\)/, "(" + updatedQTY + ")");
                      } else {
                        lotExpDetail[curLotNum] =  dateStr + " (" + curLotQTY + ")"
                      }
                      
                    }
                    
                    log.debug('LotExpDetail', lotExpDetail);

                    itemInvtyDetailList["line_"+ i] = lotExpDetail;

                  }
                }

                log.debug('Item Expiration(lot by lot)', itemInvtyDetailList);

              }

                   
               var jsonDataAdvPdfTemplate = "<#assign itemLotExpDate="+ JSON.stringify(itemInvtyDetailList) + "/>";
                log.debug("jsonDataAdvPdfTemplate",jsonDataAdvPdfTemplate);
                scriptContext.response.writeLine(jsonDataAdvPdfTemplate);
            } catch (e) {
                log.error(e.name, e.message + ' >>> ' + e);
            }
        }

        return {onRequest}

    });
