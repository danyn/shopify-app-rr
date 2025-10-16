import { useNavigation } from 'react-router';


export function LoadingIndicator() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";
  
  if(!isLoading) return <></>;

  return (
<div className="LoadingIndicator">
  
  <s-spinner accessibilityLabel="Loading" size="large-100" />

</div>
  );
}