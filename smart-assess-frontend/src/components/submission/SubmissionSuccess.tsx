interface SubmissionSuccessProps {
  isVisible: boolean;
  message: string;
  hasCVAnalysis?: boolean;
}

export default function SubmissionSuccess({ isVisible, message, hasCVAnalysis }: SubmissionSuccessProps) {
  if (!isVisible) return null;

  return (
    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
      <div className="text-green-700">
        <p className="font-medium text-lg mb-2">{message}</p>
        {hasCVAnalysis && (
          <p className="text-sm">
            Votre CV a été analysé avec succès par notre IA !
          </p>
        )}
        <p className="text-sm mt-2 text-gray-600">
          Vous serez redirigé vers vos candidatures dans quelques instants...
        </p>
      </div>
    </div>
  );
}
