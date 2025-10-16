// import { Modal, TitleBar } from "@shopify/app-bridge-react";
// import {
//   AlertTriangleIcon
// } from '@shopify/polaris-icons';
// import {
//   Icon
// } from '@shopify/polaris';
import { useState } from "react";

type P = {
  buttonText: string;
  message?: string;
  action: any
}
export function ModalConfirm({
  buttonText,
  message="All fields and associated data will be permanently removed.", 
  action
}: P) {
  const [isDisabled, setDisabled] = useState(false);
  return (
    <s-modal id="ModalConfirm">
    {/* <TitleBar title="Confirmation"> */}
      <button
          onClick={() => shopify.modal.hide('ModalConfirm')}
          disabled={isDisabled}
        >
        Cancel
      </button>
      <button 
        variant="primary"
        disabled={isDisabled}
        onClick={() => {
          action();
          setDisabled(true);
        }}
      >
        {buttonText}
      </button>
    {/* </TitleBar> */}
    <div className="ModalConfirm-message">
      <div style={{alignSelf: 'flex-start'}}>
        {/* <Icon source={AlertTriangleIcon}/> */}
        <s-icon type="alert-triangle"/>
      </div>
      
      <div>
        <p>This action is final and cannot be undone. </p>
        <p>
          {message}
        </p>
      </div>
 
    </div>
 </s-modal>
  )
}