import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useDarkMode } from '../context/DarkModeContext';
import { Button } from '../components/ui/button';
import { Plus, Sun, Moon, User, LogOut, Presentation, Search, X, Pencil, Trash2 } from 'lucide-react';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { StarIcon } from '@heroicons/react/24/solid';
import { UserProfilePopup } from '../components/UserProfilePopup';
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  
  // Format date as dd-mm-yyyy
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  
  // Format time
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${formattedDate} ${time}`;
};

const FeedbackSection = ({ topicId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/feedback/topic/${topicId}`);
        console.log('Fetched feedbacks:', response.data);
        setFeedbacks(response.data);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchFeedback();
    }
  }, [topicId]);

  if (loading) return <div>Loading feedback...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Calculate average rating
  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-muted-foreground">Total Feedback</h3>
          <p className="text-2xl font-bold">{feedbacks.length}</p>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-muted-foreground">Average Rating</h3>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{averageRating}</p>
            <StarIcon className="h-5 w-5 text-yellow-400" fill="currentColor" />
          </div>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="space-y-2">
        {feedbacks.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No feedback received yet.
          </div>
        ) : (
          feedbacks.map((feedback, index) => (
            <Card key={feedback._id || index} className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(feedback.rating)].map((_, i) => (
                      <StarIcon 
                        key={i} 
                        className="h-4 w-4 text-yellow-400" 
                        fill="currentColor" 
                      />
                    ))}
                  </div>
                  <p className="text-sm mt-2">{feedback.comment}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const SpeakerDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showingFeedback, setShowingFeedback] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [sortByMap, setSortByMap] = useState({});  // { topicId: sortValue }
  const [editingTopic, setEditingTopic] = useState(null);  // Stores topic ID being edited
  const [editedTopicName, setEditedTopicName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [topicError, setTopicError] = useState('');
  const [speakerInfo, setSpeakerInfo] = useState({
    speakerName: '',
    conferenceDate: '',
    conferenceTime: '',
    duration: 60
  });

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');

    console.log('Auth check:', { token: !!token, userRole, email });

    if (!token || userRole !== 'speaker') {
      console.log('Unauthorized access, redirecting to login');
      navigate('/');
      return;
    }

    setUserEmail(email);
    fetchTopicsAndQuestions();
  }, [navigate]);

  const fetchTopicsAndQuestions = async () => {
    try {
      setLoading(true);
      const [topicsResponse, questionsResponse] = await Promise.all([
        api.get('/topics/speaker'),
        api.get('/questions/speaker-questions')
      ]);

      setTopics(topicsResponse.data);
      
      // Check if questionsByTopic exists and has data
      if (questionsResponse.data && questionsResponse.data.questionsByTopic) {
        // Transform the questions data to match the original structure
        const transformedQuestions = Object.entries(questionsResponse.data.questionsByTopic).reduce((acc, [topicName, questions]) => {
          if (questions && questions.relevant && questions.nonRelevant) {
            const allQuestions = [
              ...questions.relevant.map(q => ({ ...q, isRelevant: true, topic: topicName })),
              ...questions.nonRelevant.map(q => ({ ...q, isRelevant: false, topic: topicName }))
            ];
            return [...acc, ...allQuestions];
          }
          return acc;
        }, []);

        setQuestions(transformedQuestions);
      } else {
        // If no questions data, set empty array
        setQuestions([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    console.log('Signing out...');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    setTopics([]);
    setQuestions([]);
    setUserEmail('');
    navigate('/');
  };

  // Add this function to handle approving/rejecting questions
  const handleQuestionAction = async (questionId, status) => {
    try {
      console.log('Making request:', {
        url: `/questions/${questionId}/status`,
        method: 'PATCH',
        data: { status },
        token: localStorage.getItem('token')
      });

      const response = await api.patch(`/questions/${questionId}/status`, { status });
      console.log('Success response:', response.data);
      
      // Update local state immediately
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q._id === questionId ? { ...q, status: status } : q
        )
      );

      // Refresh the data from server
      await fetchTopicsAndQuestions();
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error?.config
      });

      if (!error.response) {
        setError('Network error. Please check if the server is running.');
      } else {
        setError(error.response?.data?.message || 'Failed to update question status');
      }
      setTimeout(() => setError(''), 3000);
    }
  };

  // Add delete handler function
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.delete(`/questions/${questionId}`);
      // Update local state to remove the question
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => q._id !== questionId)
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete question');
    }
  };

  // Add new topic handler
  const handleAddTopic = async (e) => {
    e.preventDefault();
    setTopicError('');
    setSuccessMessage('');

    try {
      // Create a date object combining the date and time
      const dateTime = new Date(`${speakerInfo.conferenceDate}T${speakerInfo.conferenceTime}`);
      
      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateTime < today) {
        setTopicError('Conference date cannot be in the past');
        return;
      }

      const response = await api.post('/topics', {
        name: newTopic.trim(),
        speakerInfo: {
          ...speakerInfo,
          conferenceTime: dateTime.toISOString()
        },
        startTime: dateTime,
        endTime: new Date(dateTime.getTime() + speakerInfo.duration * 60000)
      });

      setTopics(prev => [...prev, response.data]);
      setNewTopic('');
      setIsAddingTopic(false);
      setSpeakerInfo({
        speakerName: '',
        conferenceDate: '',
        conferenceTime: '',
        duration: 60
      });
      setSuccessMessage('Topic created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating topic:', error);
      setTopicError(error.response?.data?.message || 'Failed to create topic');
    }
  };

  // Add this function to sort and filter questions
  const getSortedQuestions = (questions, topicName) => {
    // Filter questions for this topic first
    let topicQuestions = questions.filter(q => q.topic === topicName);
    
    // Then filter for relevant questions
    let filteredQuestions = topicQuestions.filter(q => q.isRelevant === true);
    
    if (searchQuery) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sortBy = sortByMap[topicName] || 'latest';
    return filteredQuestions.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'earliest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'status':
          const statusOrder = { approved: -1, pending: 0, rejected: 1 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
  };

  // Add function to handle sort changes for specific topics
  const handleSortChange = (topicId, sortValue) => {
    setSortByMap(prev => ({
      ...prev,
      [topicId]: sortValue
    }));
  };

  const handleEditTopic = async (topicId) => {
    try {
      const response = await api.patch(`/topics/${topicId}`, {
        name: editedTopicName
      });

      setTopics(prev => prev.map(topic => 
        topic._id === topicId ? { ...topic, name: editedTopicName } : topic
      ));
      setEditingTopic(null);
      setEditedTopicName('');
      setSuccessMessage('Topic updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating topic:', error);
      setError(error.response?.data?.message || 'Failed to update topic');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? All associated questions will also be deleted.')) {
      return;
    }

    try {
      // Get the topic name before deleting
      const topicToDelete = topics.find(t => t._id === topicId);
      if (!topicToDelete) return;

      const response = await api.delete(`/topics/${topicId}`);
      
      // Remove the topic from topics state
      setTopics(prev => prev.filter(topic => topic._id !== topicId));
      
      // Remove all questions associated with this topic (by both ID and name)
      setQuestions(prev => prev.filter(question => 
        question.topicId !== topicId && question.topic !== topicToDelete.name
      ));
      
      setSuccessMessage('Topic deleted successfully!');
      console.log('Deleted:', response.data);

      // Fetch updated data
      await fetchTopicsAndQuestions();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting topic:', error);
      setError(error.response?.data?.message || 'Failed to delete topic');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Add a new function to get non-relevant questions
  const getNonRelevantQuestions = (questions, topicName) => {
    // Filter questions for this topic first
    let topicQuestions = questions.filter(q => q.topic === topicName);
    
    // Then filter for non-relevant questions
    let filteredQuestions = topicQuestions.filter(q => q.isRelevant === false);
    
    if (searchQuery) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredQuestions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Add this function to get relevant questions
  const getRelevantQuestions = (questions, topicName) => {
    // Filter questions for this topic first
    let topicQuestions = questions.filter(q => q.topic === topicName);
    
    // Then filter for relevant questions
    let filteredQuestions = topicQuestions.filter(q => q.isRelevant === true);
    
    if (searchQuery) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by score (AI relevance) in descending order
    return filteredQuestions.sort((a, b) => b.score - a.score);
  };

  // Update the question display to show AI metrics
  const QuestionCard = ({ question }) => (
    <div className="bg-card p-4 rounded-lg shadow space-y-2">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium">{question.content}</p>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            question.isRelevant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {question.isRelevant ? 'Relevant' : 'Not Relevant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(question.confidence * 100)}% confidence
          </span>
        </div>
      </div>
      {/* Rest of the question card content */}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Speaker Dashboard</h1>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={0}>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDarkMode}
                    >
                      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to {isDarkMode ? 'light' : 'dark'} mode</p>
                  </TooltipContent>
                </TooltipRoot>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowProfilePopup(true)}
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>User profile</p>
                  </TooltipContent>
                </TooltipRoot>
              </TooltipProvider>

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Add Topic Button/Form right after header */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!isAddingTopic ? (
          <Button
            onClick={() => setIsAddingTopic(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Topic
          </Button>
        ) : (
          <div className="border border-border rounded-lg p-6 bg-card/50">
            <form onSubmit={handleAddTopic} className="space-y-6">
              {topicError && (
                <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                  {topicError}
                </div>
              )}
              
              <div>
                <Label htmlFor="topicName" className="text-lg">Topic Name</Label>
                <Input
                  id="topicName"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Enter topic name"
                  className="mt-2 bg-background"
                  required
                />
              </div>

              <div>
                <Label htmlFor="speakerName" className="text-lg">Speaker Name</Label>
                <Input
                  id="speakerName"
                  value={speakerInfo.speakerName}
                  onChange={(e) => setSpeakerInfo(prev => ({
                    ...prev,
                    speakerName: e.target.value
                  }))}
                  placeholder="Enter speaker name"
                  className="mt-2 bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="conferenceDate" className="text-lg">Conference Date</Label>
                  <Input
                    id="conferenceDate"
                    type="date"
                    value={speakerInfo.conferenceDate}
                    onChange={(e) => setSpeakerInfo(prev => ({
                      ...prev,
                      conferenceDate: e.target.value
                    }))}
                    min={getTodayString()}
                    required
                    className="mt-2 bg-background text-foreground"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  />
                </div>
                <div>
                  <Label htmlFor="conferenceTime" className="text-lg">Conference Time</Label>
                  <Input
                    id="conferenceTime"
                    type="time"
                    value={speakerInfo.conferenceTime}
                    onChange={(e) => setSpeakerInfo(prev => ({
                      ...prev,
                      conferenceTime: e.target.value
                    }))}
                    required
                    className="mt-2 bg-background text-foreground"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-lg">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={speakerInfo.duration}
                    onChange={(e) => setSpeakerInfo(prev => ({
                      ...prev,
                      duration: e.target.value
                    }))}
                    min="1"
                    required
                    className="mt-2 bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Add Topic
                </Button>
                <Button
                  type="button" 
                  variant="ghost"
                  onClick={() => {
                    setIsAddingTopic(false);
                    setNewTopic('');
                    setTopicError('');
                  }}
                  className="text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {topics.map((topic) => (
          <div key={topic._id} className="mb-8 border border-border rounded-lg p-6 bg-card/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                {editingTopic === topic._id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedTopicName}
                      onChange={(e) => setEditedTopicName(e.target.value)}
                      className="w-64"
                      placeholder="Enter new topic name"
                    />
                    <Button 
                      size="sm"
                      onClick={() => handleEditTopic(topic._id)}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTopic(null);
                        setEditedTopicName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{topic.name}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTopic(topic._id);
                        setEditedTopicName(topic.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTopic(topic._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <select
                    value={sortByMap[topic.name] || 'latest'}
                    onChange={(e) => handleSortChange(topic.name, e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    <option value="latest">Latest First</option>
                    <option value="earliest">Earliest First</option>
                    <option value="status">By Status</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-sm"
                  />
                </div>
                <Button
                  onClick={() => setShowingFeedback(showingFeedback === topic._id ? null : topic._id)}
                  className={`flex items-center gap-2 ${
                    showingFeedback === topic._id 
                      ? 'bg-gray-600 hover:bg-gray-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                >
                  <Presentation className="h-4 w-4" />
                  Conference Feedback
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCard topic={topic} questions={questions} />

            {/* Conference Feedback Section */}
            {showingFeedback === topic._id && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Conference Feedback</h3>
                <div className="bg-card rounded-lg">
                  <FeedbackSection topicId={topic._id} />
                </div>
              </div>
            )}

            {/* Relevant Questions Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Relevant Questions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedQuestions(questions, topic.name).map((question, index) => (
                    <TableRow key={question._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{question.content}</TableCell>
                      <TableCell>{formatDateTime(question.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {!questions.filter(q => q.topic === topic.name && q.isRelevant === true).length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No relevant questions for this topic yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Non-Relevant Questions Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Non-Relevant Questions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getNonRelevantQuestions(questions, topic.name).map((question, index) => (
                    <TableRow key={question._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{question.content}</TableCell>
                      <TableCell>{formatDateTime(question.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {!questions.filter(q => q.topic === topic.name && q.isRelevant === false).length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No non-relevant questions for this topic.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </main>

      {/* Add the popup */}
      {showProfilePopup && (
        <>
          {console.log('Current userEmail state:', userEmail)} {/* Debug log */}
          <UserProfilePopup
            email={userEmail}
            role="speaker"
            onClose={() => setShowProfilePopup(false)}
          />
        </>
      )}
    </div>
  );
};

const StatsCard = ({ topic, questions }) => {
  const topicQuestions = questions.filter(q => q.topic === topic.name);
  const relevantQuestions = topicQuestions.filter(q => q.isRelevant === true);
  const nonRelevantQuestions = topicQuestions.filter(q => q.isRelevant === false);

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="text-sm font-medium text-muted-foreground">Relevant Questions</h3>
        <p className="text-2xl font-bold">{relevantQuestions.length}</p>
      </Card>
      <Card className="p-4 bg-red-50 dark:bg-red-900/20">
        <h3 className="text-sm font-medium text-muted-foreground">Non-Relevant Questions</h3>
        <p className="text-2xl font-bold">{nonRelevantQuestions.length}</p>
      </Card>
    </div>
  );
};

export default SpeakerDashboard; 